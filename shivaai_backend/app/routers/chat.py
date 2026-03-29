"""
Chat router — /api/v1/chat
Handles both regular and streaming chat interactions with Self-RAG.
"""

import json
import uuid
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest, ChatResponse, SourceDocument
from app.services.rag_service import process_chat, process_chat_stream

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


async def _sse_generator(message: str, session_id: str) -> AsyncGenerator[str, None]:
    """Generate SSE events from the streaming RAG pipeline."""
    try:
        # Send session_id as first event
        yield f"data: {json.dumps({'type': 'session', 'session_id': session_id})}\n\n"

        # Stream tokens
        async for token in process_chat_stream(message, session_id):
            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

        # Send done event
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        logger.error("SSE stream error: %s", e)
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@router.post("/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint with Self-RAG pipeline.
    Supports both regular and streaming (SSE) responses.
    """
    session_id = request.session_id or str(uuid.uuid4())

    # ── Streaming mode ──
    if request.stream:
        return StreamingResponse(
            _sse_generator(request.message, session_id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    # ── Regular mode ──
    result = await process_chat(request.message, session_id)

    return ChatResponse(
        answer=result.answer,
        sources=[
            SourceDocument(**s) for s in result.sources
        ],
        confidence=result.confidence,
        needs_professional_review=result.needs_professional_review,
        session_id=session_id,
        used_retrieval=result.used_retrieval,
    )


# ─────────────────────────────────────────────
# WebSocket (backward compatibility)
# ─────────────────────────────────────────────
@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket):
    """WebSocket endpoint for real-time chat (backward compatible)."""
    await websocket.accept()

    try:
        while True:
            query = await websocket.receive_text()
            result = await process_chat(query)

            response = {
                "question": query,
                "llm_answer": result.answer,
                "retrieved_docs": [
                    s["content"] for s in result.sources
                ],
                "confidence": result.confidence,
                "needs_professional_review": result.needs_professional_review,
            }
            await websocket.send_json(response)

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error("WebSocket error: %s", e)
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass
