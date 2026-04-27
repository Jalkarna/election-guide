"""
ElectionGuide — FastAPI backend with Gemini streaming and Vercel AI SDK data stream protocol.
"""
import asyncio
import hashlib
import json
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import AsyncIterator
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import settings
from database import init_db, get_db, AsyncSessionLocal, Session as ChatSession, Message as ChatMessage
from prompts import SYSTEM_PROMPT
from tools import TOOLS, GSEARCH_AVAILABLE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ElectionGuide API", version="1.0.0")

STREAM_TEXT_CHUNK_SIZE = 48
STREAM_CHUNK_DELAY_SECONDS = 0.015

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
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
        "Missing Gemini auth. Set GOOGLE_API_KEY or USE_VERTEX_AI=true with GCP_PROJECT_ID."
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
    language: str | None = "English"


class UiTranslateRequest(BaseModel):
    language: str
    messages: dict[str, str]


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
    worked_ms: int | None
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
    data = json.dumps(payload)
    return f"{type_id}:{data}\n"


def text_delta(text: str) -> str:
    return _data_part("0", text)


def reasoning_delta(text: str) -> str:
    # type "g" = reasoning delta
    return f"g:{json.dumps(text)}\n"


def _tool_reasoning_text(tool_name: str, args: dict) -> str:
    if tool_name == "search":
        query = str(args.get("query", "")).strip()
        return f"I need to verify this against sources, so I am searching for: {query}\n\n"
    if tool_name == "fetch_url":
        url = str(args.get("url", "")).strip()
        host = urlparse(url).netloc or url
        return f"I found a likely source and am reading {host} for the details.\n\n"
    if tool_name == "get_election_schedule":
        return "I need current schedule information, so I am checking the election schedule source.\n\n"
    return f"I am using `{tool_name}` to gather the missing information before answering.\n\n"


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


def _candidate_parts(candidate) -> list:
    content = getattr(candidate, "content", None)
    parts = getattr(content, "parts", None)
    return parts or []


def _thinking_config_for_model(model: str, effort: str = "high"):
    from google.genai import types

    if "gemini-3" in model and hasattr(types, "ThinkingLevel"):
        level = {
            "low": types.ThinkingLevel.LOW,
            "medium": types.ThinkingLevel.MEDIUM,
            "high": types.ThinkingLevel.HIGH,
        }.get(effort, types.ThinkingLevel.HIGH)
        return types.ThinkingConfig(
            include_thoughts=True,
            thinking_level=level,
        )

    return types.ThinkingConfig(
        include_thoughts=True,
        thinking_budget=1024 if effort == "high" else 512,
    )


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


def _system_instruction_for_language(language: str | None) -> str:
    selected_language = (language or "English").strip() or "English"
    return (
        SYSTEM_PROMPT
        + "\n\nIMPORTANT: The user has selected "
        + f"'{selected_language}' as the response language. You MUST write the "
        + f"entire user-facing answer in {selected_language}, regardless of the "
        + "language used in the user's question. Keep official names, source URLs, "
        + "and legal abbreviations unchanged when appropriate."
    )


_UI_TRANSLATION_CACHE: dict[str, dict[str, str]] = {}
_SUPPORTED_UI_LANGUAGES = {
    "English", "Assamese", "Bengali", "Bodo", "Dogri", "Gujarati", "Hindi",
    "Kannada", "Kashmiri", "Konkani", "Maithili", "Malayalam", "Manipuri",
    "Marathi", "Nepali", "Odia", "Punjabi", "Sanskrit", "Santali", "Sindhi",
    "Tamil", "Telugu", "Urdu",
}


def _ui_translation_cache_key(language: str, messages: dict[str, str]) -> str:
    payload = json.dumps(messages, ensure_ascii=False, sort_keys=True)
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    return f"{language}:{digest}"


def _coerce_ui_translation(source: dict[str, str], translated: object) -> dict[str, str]:
    if not isinstance(translated, dict):
        return source

    result: dict[str, str] = {}
    for key, value in source.items():
        next_value = translated.get(key)
        if isinstance(next_value, str) and next_value.strip():
            result[key] = next_value.strip()
        else:
            result[key] = value
    return result


async def _translate_ui_messages(language: str, messages: dict[str, str]) -> dict[str, str]:
    if language.lower() == "english":
        return messages

    cache_key = _ui_translation_cache_key(language, messages)
    cached = _UI_TRANSLATION_CACHE.get(cache_key)
    if cached is not None:
        return cached

    from google.genai import types

    client = _create_genai_client()
    prompt = (
        f"Translate this ElectionGuide website UI copy into {language}.\n"
        "Return only a valid JSON object with exactly the same keys. "
        "Preserve placeholders such as {duration}, {query}, and {url}. "
        "Keep the product name ElectionGuide unchanged. "
        "Keep official abbreviations such as ECI, PIB, EVM, and VVPAT unchanged. "
        "Do not add markdown, explanations, or extra keys.\n\n"
        f"{json.dumps(messages, ensure_ascii=False, sort_keys=True)}"
    )
    response = await client.aio.models.generate_content(
        model=settings.gemini_model_candidates[0],
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.0,
            response_mime_type="application/json",
        ),
    )

    try:
        parsed = json.loads(response.text or "{}")
    except Exception:
        logger.warning("UI translation response was not valid JSON for %s", language)
        parsed = {}

    translated = _coerce_ui_translation(messages, parsed)
    _UI_TRANSLATION_CACHE[cache_key] = translated
    return translated


def _extract_source_urls(tool_name: str, tool_result: str, args: dict) -> list[str]:
    urls: list[str] = []

    if tool_name == "fetch_url" and isinstance(args.get("url"), str):
        urls.append(args["url"])

    if tool_name == "search":
        # Try to parse structured JSON first (new format)
        try:
            parsed = json.loads(tool_result)
            if isinstance(parsed, dict) and isinstance(parsed.get("results"), list):
                for item in parsed["results"]:
                    if isinstance(item, dict) and isinstance(item.get("url"), str):
                        u = item["url"].strip()
                        if u and u.startswith("http"):
                            urls.append(u)
        except Exception:
            pass

        # Fallback: regex extraction from plain text
        if not urls:
            urls.extend(re.findall(r"https?://[^\s)'\"]+", tool_result))

    deduped: list[str] = []
    seen: set[str] = set()
    for url in urls:
        clean = url.strip().rstrip(".,])'\"")
        if not clean or clean in seen or not clean.startswith("http"):
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
                "indiankanoon.org",
                "indiavotes.gov.in",
            )
            for host in [urlparse(url).netloc.lower()]
        )
    ]
    return preferred or deduped[:5]


def _annotation_payload(kind: str, value: str) -> dict:
    return {"type": kind, "text": value}


# ─── Signature handling ─────────────────────────────────────────────────────

# Official Vertex AI bypass string — skips thought_signature validation.
# Use this when we can't capture or graft the real streaming signature.
# Ref: https://cloud.google.com/vertex-ai/generative-ai/docs/thought-signatures
_SIG_BYPASS = b"skip_thought_signature_validator"


def _ensure_thought_signatures(parts: list) -> list:
    """
    Two-phase signature handling for Gemini 3 streaming:

    Phase 1 — Graft: During streaming, thought_signature for a functionCall
    may arrive as a trailing Part(text="", thought_signature=<bytes>) with no
    function_call. Find those and graft their signature onto the preceding
    bare functionCall Part.

    Phase 2 — Bypass: For any functionCall Part that STILL has no signature
    after grafting (either because the SDK doesn't expose thought_signature as
    an attribute, or it arrived outside our collection window), inject the
    official Vertex AI bypass string so validation passes.
    """
    from google.genai import types as _types

    # ── Phase 1: Log + graft trailing signature carriers ──────────────────────
    result = []
    for i, part in enumerate(parts):
        sig = getattr(part, "thought_signature", None)
        has_fc = bool(getattr(part, "function_call", None))
        is_thought = bool(getattr(part, "thought", False))
        has_real_text = bool(getattr(part, "text", None) and part.text.strip())

        # Diagnostic: log every part so we can see what the SDK gives us
        logger.debug(
            "Part[%d]: thought=%s fc=%s text_len=%d sig_bytes=%d",
            i, is_thought, has_fc,
            len(part.text or ""),
            len(sig) if sig else 0,
        )

        is_trailing_sig_carrier = sig and not has_fc and not is_thought and not has_real_text

        if is_trailing_sig_carrier:
            # Walk backwards for the nearest bare functionCall Part
            grafted = False
            for j in range(len(result) - 1, -1, -1):
                prev = result[j]
                if getattr(prev, "function_call", None) and not getattr(prev, "thought_signature", None):
                    try:
                        result[j] = _types.Part(
                            function_call=prev.function_call,
                            thought_signature=sig,
                        )
                        logger.debug("Grafted thought_signature (%d bytes) onto FC part[%d]", len(sig), j)
                        grafted = True
                    except Exception as e:
                        logger.warning("Graft failed: %s", e)
                    break
            if not grafted:
                result.append(part)
        else:
            result.append(part)

    # ── Phase 2: Bypass for any FC still missing a signature ──────────────────
    final = []
    for part in result:
        if getattr(part, "function_call", None) and not getattr(part, "thought_signature", None):
            logger.warning(
                "functionCall '%s' has no thought_signature after grafting — "
                "injecting bypass string", part.function_call.name
            )
            try:
                patched = _types.Part(
                    function_call=part.function_call,
                    thought_signature=_SIG_BYPASS,
                )
                final.append(patched)
            except Exception as e:
                logger.warning("Bypass injection failed (%s), appending original part", e)
                final.append(part)
        else:
            final.append(part)

    return final



# ─── Gemini streaming core ──────────────────────────────────────────────────

async def stream_gemini_response(
    current_user_msg: str,
    session_id: str,
    db: AsyncSession,
    language: str = "English",
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

    # Tool declarations
    tool_declarations = TOOLS

    # ThinkingConfig ON — we need thoughts rendered in the UI.
    # We bypass AsyncChat (which strips thought_signature from its internal
    # history) and manage history manually so signatures are preserved verbatim.
    # Accumulated output for DB persistence
    loop = asyncio.get_running_loop()
    started_at = loop.time()
    full_thinking = []
    full_text = []
    tool_calls_log = []
    sources = []

    # Overall 90-second deadline for the entire agentic loop
    overall_deadline = loop.time() + 90

    # ── Manual history management (bypasses AsyncChat) ───────────────────────
    # history[-1] at the end of each turn is a Content with ALL parts verbatim
    # from the stream, which preserves thought_signature on functionCall parts.
    history: list[types.Content] = list(gemini_history)
    history.append(types.Content(role="user", parts=[types.Part(text=current_user_msg)]))

    candidate_models = settings.gemini_model_candidates
    active_model_index = 0
    active_model = candidate_models[active_model_index]

    try:
        max_iterations = 4
        for iteration in range(max_iterations):
            if loop.time() > overall_deadline:
                logger.warning("Overall streaming deadline exceeded at iteration %d", iteration)
                yield text_delta("\n\n*Response timed out — please try again.*")
                break

            # ── Stream one turn ──────────────────────────────────────────────
            accumulated_parts: list[types.Part] = []
            iter_deadline = loop.time() + 60.0

            try:
                system_instruction = _system_instruction_for_language(language)
                gen_config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    tools=tool_declarations,
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                    thinking_config=_thinking_config_for_model(active_model, "low"),
                    temperature=0.1,
                    max_output_tokens=8192,
                )
                stream = await client.aio.models.generate_content_stream(
                    model=active_model,
                    contents=history,
                    config=gen_config,
                )
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
                    continue
                raise

            seen_fc_sigs: set[tuple[str, str]] = set()

            async for chunk in stream:
                if loop.time() > iter_deadline:
                    logger.error("Per-iteration stream deadline exceeded at iteration %d", iteration)
                    if not full_text:
                        yield text_delta("I was unable to get a response in time. Please try again.")
                    else:
                        yield text_delta("\n\n*Response generation timed out.*")
                    break

                for candidate in chunk.candidates or []:
                    for part in _candidate_parts(candidate):
                        # ── Accumulate EVERY part verbatim — including empty-text
                        # parts that carry thought_signature. Never skip these.
                        accumulated_parts.append(part)

                        # ── Stream to client ──────────────────────────────────
                        if getattr(part, "thought", False) and part.text:
                            full_thinking.append(part.text)
                            for chunk_text in _chunk_text(part.text, STREAM_TEXT_CHUNK_SIZE):
                                yield reasoning_delta(chunk_text)
                                await asyncio.sleep(STREAM_CHUNK_DELAY_SECONDS)
                        elif part.text and not getattr(part, "thought", False):
                            full_text.append(part.text)
                            for chunk_text in _chunk_text(part.text, STREAM_TEXT_CHUNK_SIZE):
                                yield text_delta(chunk_text)
                                await asyncio.sleep(STREAM_CHUNK_DELAY_SECONDS)
                        # function_call parts are handled below after stream ends

            # ── Graft trailing signature carriers onto their functionCall Parts ──
            # During streaming, thought_signature arrives as a separate empty-text
            # Part AFTER the functionCall Part. We must attach it before building
            # the Content we append to history, otherwise Vertex AI rejects turn 2+.
            final_parts = _ensure_thought_signatures(accumulated_parts)

            # ── Append the COMPLETE model turn to history verbatim ───────────
            model_content = types.Content(role="model", parts=final_parts)
            history.append(model_content)

            # ── Extract function calls from final_parts ───────────────────────
            fc_parts = [p for p in final_parts if getattr(p, "function_call", None)]

            if not fc_parts:
                # No tool calls → final answer
                break

            # ── Execute tools and build a single tool-response Content ────────
            # All FunctionResponses MUST go into one Content (parallel call rule).
            tool_response_parts: list[types.Part] = []

            for part in fc_parts:
                fc = part.function_call
                tool_name = fc.name
                args = dict(fc.args) if fc.args else {}
                sig = (tool_name, json.dumps(args, sort_keys=True))
                if sig in seen_fc_sigs:
                    continue
                seen_fc_sigs.add(sig)

                tool_call_id = str(uuid.uuid4())[:8]
                args_str = json.dumps(args)

                # Move any streamed intro text to thinking log
                if full_text:
                    full_thinking.extend(full_text)
                    full_text.clear()
                tool_reasoning = _tool_reasoning_text(tool_name, args)
                full_thinking.append(tool_reasoning)
                yield reasoning_delta(tool_reasoning)
                await asyncio.sleep(STREAM_CHUNK_DELAY_SECONDS)
                full_thinking.append(f"\n\n[TOOL_CALL:{tool_call_id}]\n\n")

                logger.info(f"Tool call: {tool_name}({args_str[:200]})")
                yield tool_call_start(tool_call_id, tool_name, args_str)
                await asyncio.sleep(0)

                try:
                    tool_result = await asyncio.wait_for(
                        _execute_tool(tool_name, args),
                        timeout=20.0,
                    )
                except asyncio.TimeoutError:
                    logger.error("Tool %s timed out", tool_name)
                    tool_result = f"Tool {tool_name} timed out — please try again."

                yield tool_result_part(tool_call_id, tool_name, tool_result[:500])
                await asyncio.sleep(0)

                tool_calls_log.append({
                    "id": tool_call_id,
                    "name": tool_name,
                    "args": args,
                    "result_preview": tool_result[:200],
                })
                sources.extend(_extract_source_urls(tool_name, tool_result, args))

                tool_response_parts.append(
                    types.Part.from_function_response(
                        name=tool_name,
                        response={"result": tool_result},
                    )
                )

            # ── Append all tool responses as a single "user" turn ─────────────
            # This is required — never interleave FC/FR pairs.
            history.append(types.Content(role="user", parts=tool_response_parts))

        if not full_text:
            logger.warning("Agent loop ended without final text; forcing no-tool final answer")
            synthesis_reasoning = "I have finished gathering source context and am now composing the final answer.\n\n"
            full_thinking.append(synthesis_reasoning)
            yield reasoning_delta(synthesis_reasoning)
            await asyncio.sleep(STREAM_CHUNK_DELAY_SECONDS)
            final_history = [
                *history,
                types.Content(
                    role="user",
                    parts=[
                        types.Part(
                            text=(
                                "Using the tool results already provided, answer the user's original "
                                "question directly now. Do not ask for or call any more tools."
                            )
                        )
                    ],
                ),
            ]
            system_instruction = _system_instruction_for_language(language)
            final_answer_config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                thinking_config=_thinking_config_for_model(active_model, "low"),
                temperature=0.1,
                max_output_tokens=4096,
            )
            forced_stream = await client.aio.models.generate_content_stream(
                model=active_model,
                contents=final_history,
                config=final_answer_config,
            )
            async for chunk in forced_stream:
                for candidate in chunk.candidates or []:
                    for part in _candidate_parts(candidate):
                        if getattr(part, "thought", False) and part.text:
                            full_thinking.append(part.text)
                            for chunk_text in _chunk_text(part.text, STREAM_TEXT_CHUNK_SIZE):
                                yield reasoning_delta(chunk_text)
                                await asyncio.sleep(STREAM_CHUNK_DELAY_SECONDS)
                        elif part.text and not getattr(part, "thought", False):
                            full_text.append(part.text)
                            for chunk_text in _chunk_text(part.text, STREAM_TEXT_CHUNK_SIZE):
                                yield text_delta(chunk_text)
                                await asyncio.sleep(STREAM_CHUNK_DELAY_SECONDS)

            if not full_text:
                fallback_text = (
                    "I could not produce a final answer from the model after the tool calls. "
                    "Please try again in a moment."
                )
                full_text.append(fallback_text)
                yield text_delta(fallback_text)

        # Emit sources
        if sources:
            yield data_annotation([{"type": "sources", "urls": list(set(sources))}])

        yield finish_message("stop", {"promptTokens": 0, "completionTokens": 0})

        # Persist assistant message to DB
        await _save_assistant_message(
            db=db,
            session_id=session_id,
            content="\n".join(full_text),
            thinking_content="\n".join(full_thinking) if full_thinking else None,
            tool_calls={"calls": tool_calls_log} if tool_calls_log else None,
            sources=list(set(sources)) if sources else None,
            worked_ms=round((loop.time() - started_at) * 1000),
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
            worked_ms=round((loop.time() - started_at) * 1000),
        )



def _chunk_text(text: str, size: int):
    """Yield text in chunks for smooth streaming."""
    for i in range(0, len(text), size):
        yield text[i:i + size]


async def _execute_tool(tool_name: str, args: dict) -> str:
    """Execute a registered tool by name in a thread pool."""
    tool_map = {fn.__name__: fn for fn in TOOLS}

    fn = tool_map.get(tool_name)
    if not fn:
        return f"Unknown tool: {tool_name}"

    loop = asyncio.get_running_loop()
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
    worked_ms: int | None,
):
    msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=content,
        thinking_content=thinking_content,
        tool_calls=tool_calls,
        sources=sources,
        worked_ms=worked_ms,
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
        "model": settings.gemini_model_candidates[0],
        "model_candidates": settings.gemini_model_candidates,
        "transport": settings.gemini_transport,
        "gsearch": GSEARCH_AVAILABLE,
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
    user_msg_content = request.message.strip()
    language = request.language.strip() if request.language else "English"
    if not user_msg_content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
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
        user_msg_content = str(payload.get("message", "")).strip()
        language = str(payload.get("language", "English")).strip()
        if not user_msg_content:
            await websocket.send_text(text_delta("Empty message."))
            await websocket.send_text(finish_message("error"))
            await websocket.close()
            return

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
