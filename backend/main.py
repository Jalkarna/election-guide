"""
ElectionGuide — FastAPI backend with Gemini streaming and Vercel AI SDK data stream protocol.
"""
import asyncio
import json
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import AsyncIterator
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import settings
from database import init_db, get_db, Session as ChatSession, Message as ChatMessage
from prompts import SYSTEM_PROMPT
from tools import TOOLS, GSEARCH_AVAILABLE, render_timeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ElectionGuide API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-vercel-ai-ui-message-stream"],
)


def _create_genai_client():
    from google import genai

    if settings.google_api_key:
        return genai.Client(
            vertexai=True,
            api_key=settings.google_api_key,
        )

    if settings.use_vertex_ai:
        if not settings.gcp_project_id:
            raise RuntimeError("GCP_PROJECT_ID is required when USE_VERTEX_AI=true")
        return genai.Client(
            vertexai=True,
            project=settings.gcp_project_id,
            location=settings.gcp_location,
        )

    raise RuntimeError(
        "Missing Gemini auth. Set GOOGLE_API_KEY for Vertex API-key mode, or set "
        "USE_VERTEX_AI=true with GCP_PROJECT_ID for ADC mode."
    )


@app.on_event("startup")
async def startup():
    await init_db()
    logger.info(f"ElectionGuide backend started. gsearch: {GSEARCH_AVAILABLE}")
    logger.info(f"Using model candidates: {settings.gemini_model_candidates}")
    logger.info(
        "Using Gemini transport: %s",
        settings.gemini_transport,
    )


# ─── Pydantic schemas ───────────────────────────────────────────────────────

class ChatMessageInput(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str


class SessionOut(BaseModel):
    id: str
    title: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: str
    role: str
    content: str | None
    thinking_content: str | None
    tool_calls: dict | None
    sources: list | None
    created_at: datetime

    class Config:
        from_attributes = True


class SessionDetail(BaseModel):
    id: str
    title: str | None
    created_at: datetime
    updated_at: datetime
    messages: list[MessageOut]

    class Config:
        from_attributes = True


# ─── Vercel AI SDK Data Stream helpers ──────────────────────────────────────
# Format: https://sdk.vercel.ai/docs/api-reference/stream-protocol

def _data_part(type_id: str, payload: dict | str) -> str:
    """Emit a Vercel AI SDK data stream part."""
    if isinstance(payload, str):
        data = json.dumps(payload)
    else:
        data = json.dumps(payload)
    return f"{type_id}:{data}\n"


def text_delta(text: str) -> str:
    return _data_part("0", text)


def reasoning_delta(text: str) -> str:
    # type "g" = reasoning delta
    return f"g:{json.dumps(text)}\n"


def tool_call_start(tool_call_id: str, tool_name: str, args_json: str) -> str:
    payload = {"toolCallId": tool_call_id, "toolName": tool_name, "args": args_json}
    return f"b:{json.dumps(payload)}\n"


def tool_call_delta(tool_call_id: str, args_delta: str) -> str:
    payload = {"toolCallId": tool_call_id, "argsTextDelta": args_delta}
    return f"c:{json.dumps(payload)}\n"


def tool_result_part(tool_call_id: str, tool_name: str, result: str) -> str:
    payload = {"toolCallId": tool_call_id, "toolName": tool_name, "result": result}
    return f"a:{json.dumps(payload)}\n"


def data_annotation(data: list) -> str:
    return f"2:{json.dumps(data)}\n"


def finish_message(finish_reason: str = "stop", usage: dict | None = None) -> str:
    payload = {
        "finishReason": finish_reason,
        "usage": usage or {"promptTokens": 0, "completionTokens": 0},
    }
    return f"d:{json.dumps(payload)}\n"


def _is_retryable_model_error(exc: Exception) -> bool:
    status_code = getattr(exc, "status_code", None)
    if status_code in {429, 500, 502, 503, 504}:
        return True
    message = str(exc).upper()
    return "RESOURCE_EXHAUSTED" in message or "RATE_LIMIT" in message


def _friendly_error_message(exc: Exception) -> str:
    status_code = getattr(exc, "status_code", None)
    if status_code == 429 or "RESOURCE_EXHAUSTED" in str(exc).upper():
        return (
            "I hit a temporary model capacity limit and could not complete the answer. "
            "Please try again in a moment."
        )
    return (
        "I ran into a temporary backend error while generating the answer. "
        "Please try again."
    )


def _extract_source_urls(tool_name: str, tool_result: str, args: dict) -> list[str]:
    urls: list[str] = []

    if tool_name == "fetch_url" and isinstance(args.get("url"), str):
        urls.append(args["url"])

    if tool_name == "search":
        try:
            parsed = json.loads(tool_result)
            if isinstance(parsed, dict) and isinstance(parsed.get("results"), list):
                for item in parsed["results"]:
                    if isinstance(item, dict) and isinstance(item.get("url"), str):
                        urls.append(item["url"])
        except Exception:
            pass

        if not urls:
            urls.extend(re.findall(r"https?://[^\s)]+", tool_result))

    deduped: list[str] = []
    seen: set[str] = set()
    for url in urls:
        clean = url.strip().rstrip(".,]")
        if not clean or clean in seen:
            continue
        seen.add(clean)
        deduped.append(clean)

    if tool_name != "search":
        return deduped

    preferred = [
        url for url in deduped
        if any(
            host.endswith(domain) or host == domain
            for domain in (
                "eci.gov.in",
                "voters.eci.gov.in",
                "ecisveep.nic.in",
                "pib.gov.in",
                "services.india.gov.in",
            )
            for host in [urlparse(url).netloc.lower()]
        )
    ]
    return preferred or deduped[:5]


def _annotation_payload(kind: str, value: str) -> dict:
    return {"type": kind, "text": value}


# ─── Gemini streaming core ──────────────────────────────────────────────────

async def stream_gemini_response(
    current_user_msg: str,
    session_id: str,
    db: AsyncSession,
) -> AsyncIterator[str]:
    """
    Stream a Gemini response in Vercel AI SDK data stream protocol format.
    Handles thinking tokens, tool calls, and final text.
    """
    from google.genai import types

    client = _create_genai_client()

    # Load conversation history from DB
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    db_messages = history_result.scalars().all()

    # Build Gemini history from DB (exclude the just-saved user message)
    gemini_history = []
    for msg in db_messages:
        if not msg.content:
            continue
        role = "user" if msg.role == "user" else "model"
        gemini_history.append(
            types.Content(role=role, parts=[types.Part(text=msg.content)])
        )
    # Remove the last entry — it's the current user message we're about to send
    if gemini_history and gemini_history[-1].role == "user":
        gemini_history = gemini_history[:-1]

    # Tool declarations — use Google Search grounding if gsearch not available
    tool_declarations = TOOLS  # python functions with docstrings

    # Generation config with thinking enabled
    thinking_config = types.ThinkingConfig(
        include_thoughts=True,
        thinking_budget=8192,
    )

    # Build config
    gen_config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        tools=tool_declarations,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        thinking_config=thinking_config,
        temperature=0.1,
        max_output_tokens=8192,
    )

    # Accumulated output for DB persistence
    full_thinking = []
    full_text = []
    tool_calls_log = []
    sources = []

    try:
        def build_chat(model_name: str):
            return client.aio.chats.create(
                model=model_name,
                history=gemini_history,
                config=gen_config,
            )

        candidate_models = settings.gemini_model_candidates
        active_model_index = 0
        active_model = candidate_models[active_model_index]
        chat = build_chat(active_model)

        # Agentic loop — Gemini may call tools multiple times
        pending_message = current_user_msg
        max_iterations = 6

        for iteration in range(max_iterations):
            streamed_function_calls: list[tuple[str, dict]] = []
            seen_function_calls: set[tuple[str, str]] = set()

            try:
                stream = await chat.send_message_stream(pending_message)
            except Exception as exc:
                stream_started = bool(full_text or full_thinking or tool_calls_log)
                can_retry = (
                    not stream_started
                    and _is_retryable_model_error(exc)
                    and active_model_index + 1 < len(candidate_models)
                )
                if can_retry:
                    active_model_index += 1
                    active_model = candidate_models[active_model_index]
                    logger.warning(
                        "Model %s failed before streaming; retrying with %s. Error: %s",
                        candidate_models[active_model_index - 1],
                        active_model,
                        exc,
                    )
                    chat = build_chat(active_model)
                    continue
                raise

            # Reset pending for next iteration
            pending_message = None

            async for response in stream:
                for candidate in response.candidates or []:
                    if not candidate.content:
                        continue
                    for part in candidate.content.parts:
                        if hasattr(part, "thought") and part.thought and part.text:
                            full_thinking.append(part.text)
                            for chunk in _chunk_text(part.text, 50):
                                yield reasoning_delta(chunk)
                                await asyncio.sleep(0)
                        elif getattr(part, "function_call", None):
                            fc = part.function_call
                            tool_name = fc.name
                            args = dict(fc.args) if fc.args else {}
                            signature = (tool_name, json.dumps(args, sort_keys=True))
                            if signature not in seen_function_calls:
                                seen_function_calls.add(signature)
                                streamed_function_calls.append((tool_name, args))
                        elif part.text:
                            full_text.append(part.text)
                            for chunk in _chunk_text(part.text, 30):
                                yield text_delta(chunk)
                                await asyncio.sleep(0)

            tool_results_for_next_turn = []

            for tool_name, args in streamed_function_calls:
                tool_call_id = str(uuid.uuid4())[:8]
                args_str = json.dumps(args)

                if full_text:
                    full_thinking.extend(full_text)
                    full_text.clear()
                full_thinking.append(f"\n\n[TOOL_CALL:{tool_call_id}]\n\n")

                logger.info(f"Tool call: {tool_name}({args_str})")

                yield tool_call_start(tool_call_id, tool_name, args_str)
                await asyncio.sleep(0)

                tool_result = await _execute_tool(tool_name, args)

                yield tool_result_part(tool_call_id, tool_name, tool_result[:500])
                await asyncio.sleep(0)

                tool_calls_log.append({
                    "id": tool_call_id,
                    "name": tool_name,
                    "args": args,
                    "result_preview": tool_result[:200],
                })

                sources.extend(_extract_source_urls(tool_name, tool_result, args))

                tool_results_for_next_turn.append(
                    types.Part.from_function_response(
                        name=tool_name,
                        response={"result": tool_result},
                    )
                )

                if tool_name == "render_timeline":
                    try:
                        result_data = json.loads(tool_result)
                        if "steps" in result_data:
                            yield data_annotation([{
                                "type": "timeline",
                                "steps": result_data["steps"]
                            }])
                    except Exception:
                        pass

            if tool_results_for_next_turn:
                pending_message = tool_results_for_next_turn
                continue

            # If no pending tool results, we're done
            if pending_message is None:
                break

        # Emit sources as annotation
        if sources:
            yield data_annotation([{"type": "sources", "urls": list(set(sources))}])

        # Finish
        yield finish_message("stop", {"promptTokens": 0, "completionTokens": 0})

        # Persist assistant message to DB
        await _save_assistant_message(
            db=db,
            session_id=session_id,
            content="\n".join(full_text),
            thinking_content="\n".join(full_thinking) if full_thinking else None,
            tool_calls={"calls": tool_calls_log} if tool_calls_log else None,
            sources=list(set(sources)) if sources else None,
        )

    except Exception as e:
        logger.exception(f"Gemini streaming error: {e}")
        error_text = _friendly_error_message(e)
        if full_text:
            yield text_delta(f"\n\n{error_text}")
        else:
            yield text_delta(error_text)
        yield finish_message("error")
        saved_text = "\n".join(full_text).strip()
        if saved_text:
            saved_text = f"{saved_text}\n\n{error_text}"
        else:
            saved_text = error_text
        await _save_assistant_message(
            db=db,
            session_id=session_id,
            content=saved_text,
            thinking_content="\n".join(full_thinking) if full_thinking else None,
            tool_calls={"calls": tool_calls_log} if tool_calls_log else None,
            sources=list(set(sources)) if sources else None,
        )


def _chunk_text(text: str, size: int):
    """Yield text in chunks for smooth streaming."""
    for i in range(0, len(text), size):
        yield text[i:i + size]


async def _execute_tool(tool_name: str, args: dict) -> str:
    """Execute a registered tool by name in a thread pool."""
    tool_map = {fn.__name__: fn for fn in TOOLS}
    tool_map["render_timeline"] = render_timeline

    fn = tool_map.get(tool_name)
    if not fn:
        return f"Unknown tool: {tool_name}"

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, lambda: fn(**args))
        return str(result)
    except Exception as e:
        logger.error(f"Tool {tool_name} failed: {e}")
        return f"Tool error: {str(e)}"


async def _save_assistant_message(
    db: AsyncSession,
    session_id: str,
    content: str,
    thinking_content: str | None,
    tool_calls: dict | None,
    sources: list | None,
):
    msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=content,
        thinking_content=thinking_content,
        tool_calls=tool_calls,
        sources=sources,
    )
    db.add(msg)

    # Update session updated_at
    stmt = select(ChatSession).where(ChatSession.id == session_id)
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if session:
        session.updated_at = datetime.now(timezone.utc)

    await db.commit()


# ─── Routes ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "model": settings.gemini_model,
        "transport": settings.gemini_transport,
        "gsearch": GSEARCH_AVAILABLE,
    }


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


@app.post("/api/chat/sessions/{session_id}/stream")
async def chat_stream(
    session_id: str,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    # Validate session exists
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message
    user_msg_content = request.message.strip()
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=user_msg_content,
    )
    db.add(user_msg)

    # Auto-title session from first user message
    if not session.title and user_msg_content:
        session.title = user_msg_content[:60] + ("..." if len(user_msg_content) > 60 else "")

    await db.commit()

    return StreamingResponse(
        stream_gemini_response(user_msg_content, session_id, db),
        media_type="text/plain; charset=utf-8",
        headers={
            "x-vercel-ai-ui-message-stream": "v1",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
