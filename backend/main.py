"""
ElectionGuide — FastAPI backend with Gemini streaming and Vercel AI SDK data stream protocol.
"""
import asyncio
import hashlib
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth.routes import router as auth_router
from civic_platform.routes import router as platform_router
from config import settings
from database import init_db, get_db, AsyncSessionLocal, Session as ChatSession, Message as ChatMessage
from genai_client import _create_genai_client
from google_services import configure_cloud_logging, google_services_health, write_firestore_audit_event
from security import security_headers_middleware, validate_chat_message
from services.gemini_stream import _friendly_error_message, finish_message, stream_gemini_response, text_delta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_cloud_logging(settings)
    await init_db()
    logger.info("ElectionGuide backend started with search/fetch grounding tools enabled")
    logger.info(f"Using model candidates: {settings.gemini_model_candidates}")
    logger.info(
        "Using Gemini transport: %s",
        settings.gemini_transport,
    )
    yield


app = FastAPI(title="ElectionGuide API", version="1.0.0", lifespan=lifespan)
app.include_router(auth_router)
app.include_router(platform_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-vercel-ai-ui-message-stream"],
)
app.middleware("http")(security_headers_middleware)


# ─── Pydantic schemas ───────────────────────────────────────────────────────

class ChatMessageInput(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    language: str | None = "English"


class UiTranslateRequest(BaseModel):
    language: str
    messages: dict[str, str]


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str | None
    created_at: datetime
    updated_at: datetime


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    content: str | None
    thinking_content: str | None
    tool_calls: dict | None
    sources: list | None
    worked_ms: int | None
    created_at: datetime


class SessionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str | None
    created_at: datetime
    updated_at: datetime
    messages: list[MessageOut]


# ─── Routes ─────────────────────────────────────────────────────────────────



@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "model": settings.gemini_model_candidates[0],
        "model_candidates": settings.gemini_model_candidates,
        "transport": settings.gemini_transport,
        "grounding": {
            "search": True,
            "fetch": True,
            "election_schedule": True,
        },
        "google_services": google_services_health(settings),
    }


@app.post("/api/i18n/translate-ui")
async def translate_ui(request: UiTranslateRequest):
    language = request.language.strip() or "English"
    if language not in _SUPPORTED_UI_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language")

    messages = {
        str(key): str(value)
        for key, value in request.messages.items()
        if isinstance(key, str) and isinstance(value, str)
    }
    if not messages:
        return {}

    try:
        return await _translate_ui_messages(language, messages)
    except Exception as exc:
        logger.exception("UI translation failed for %s: %s", language, exc)
        raise HTTPException(status_code=503, detail="UI translation failed")


@app.post("/api/chat/sessions", response_model=SessionOut)
async def create_session(db: AsyncSession = Depends(get_db)):
    session = ChatSession()
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@app.get("/api/chat/sessions", response_model=list[SessionOut])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatSession).order_by(ChatSession.updated_at.desc())
    )
    return result.scalars().all()


@app.get("/api/chat/sessions/{session_id}", response_model=SessionDetail)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id)
        .options(selectinload(ChatSession.messages))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.delete("/api/chat/sessions/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.execute(delete(ChatSession).where(ChatSession.id == session_id))
    await db.commit()
    return {"deleted": True}


async def _save_user_message_for_stream(
    session_id: str,
    user_msg_content: str,
    db: AsyncSession,
) -> None:
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=user_msg_content,
    )
    db.add(user_msg)

    if not session.title and user_msg_content:
        session.title = user_msg_content[:60] + ("..." if len(user_msg_content) > 60 else "")

    await db.commit()
    write_firestore_audit_event(
        "chat_message_saved",
        {
            "session_id": session_id,
            "role": "user",
            "message_length": len(user_msg_content),
            "has_title": bool(session.title),
        },
        settings,
    )


class FlushingStreamResponse(Response):
    """StreamingResponse that flushes every chunk immediately via ASGI send."""

    def __init__(
        self,
        content: AsyncIterator[str],
        status_code: int = 200,
        headers: dict | None = None,
        media_type: str | None = None,
    ) -> None:
        super().__init__(content=None, status_code=status_code, headers=headers, media_type=media_type)
        self.raw_headers = [
            (key, value)
            for key, value in self.raw_headers
            if key.lower() != b"content-length"
        ]
        self._content = content

    async def __call__(self, scope, receive, send):
        await send({
            "type": "http.response.start",
            "status": self.status_code,
            "headers": self.raw_headers,
        })
        try:
            async for chunk in self._content:
                if chunk:
                    body = chunk.encode("utf-8") if isinstance(chunk, str) else chunk
                    await send({
                        "type": "http.response.body",
                        "body": body,
                        "more_body": True,
                    })
                    # Yield control to the event loop so the ASGI server
                    # actually flushes the TCP buffer to the client.
                    await asyncio.sleep(0)
        except Exception:
            logger.exception("Error during streaming")
        finally:
            await send({
                "type": "http.response.body",
                "body": b"",
                "more_body": False,
            })


@app.post("/api/chat/sessions/{session_id}/stream")
async def chat_stream(
    session_id: str,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    user_msg_content = validate_chat_message(request.message)
    language = request.language.strip() if request.language else "English"
    await _save_user_message_for_stream(session_id, user_msg_content, db)

    return FlushingStreamResponse(
        content=stream_gemini_response(user_msg_content, session_id, db, language),
        media_type="text/event-stream; charset=utf-8",
        headers={
            "x-vercel-ai-ui-message-stream": "v1",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.websocket("/api/chat/sessions/{session_id}/ws")
async def chat_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()

    try:
        payload = await websocket.receive_json()
        try:
            user_msg_content = validate_chat_message(str(payload.get("message", "")))
        except HTTPException as exc:
            await websocket.send_text(text_delta(str(exc.detail)))
            await websocket.send_text(finish_message("error"))
            await websocket.close()
            return
        language = str(payload.get("language", "English")).strip()

        async with AsyncSessionLocal() as db:
            try:
                await _save_user_message_for_stream(session_id, user_msg_content, db)
            except HTTPException as exc:
                await websocket.send_text(text_delta(str(exc.detail)))
                await websocket.send_text(finish_message("error"))
                await websocket.close()
                return

            async for chunk in stream_gemini_response(user_msg_content, session_id, db, language):
                if chunk:
                    await websocket.send_text(chunk)

        await websocket.close()
    except WebSocketDisconnect:
        logger.info("Chat websocket disconnected for session %s", session_id)
    except Exception as exc:
        logger.exception("Chat websocket error: %s", exc)
        try:
            await websocket.send_text(text_delta(_friendly_error_message(exc)))
            await websocket.send_text(finish_message("error"))
            await websocket.close()
        except Exception:
            pass
