"""
Self-RAG pipeline service.
Implements: retrieval-need classification → retrieval → generation → validation → fallback.
"""

import logging
import re
from typing import AsyncGenerator, Optional

from langchain_core.documents import Document

from app.core.llm import get_llm
from app.core.vector_store import vector_store_manager
from app.core.memory import conversation_memory
from app.core.prompts import (
    RETRIEVAL_NEED_PROMPT,
    MEDICAL_RAG_PROMPT,
    DIRECT_RESPONSE_PROMPT,
    FALLBACK_RESPONSE,
)
from app.services.validation_service import check_groundedness
from app.config import RETRIEVAL_TOP_K, GROUNDEDNESS_THRESHOLD

logger = logging.getLogger(__name__)


class RAGResult:
    """Structured result from the RAG pipeline."""

    def __init__(
        self,
        answer: str,
        sources: list[dict],
        confidence: float,
        needs_professional_review: bool,
        used_retrieval: bool,
    ):
        self.answer = answer
        self.sources = sources
        self.confidence = confidence
        self.needs_professional_review = needs_professional_review
        self.used_retrieval = used_retrieval


def _format_chat_history(history: list[dict]) -> str:
    """Format conversation history into a readable string."""
    if not history:
        return "No previous conversation."

    formatted = []
    for turn in history[-6:]:  # Last 3 turns (6 messages)
        role = "User" if turn["role"] == "user" else "Assistant"
        content = turn["content"][:200]  # Truncate long messages
        formatted.append(f"{role}: {content}")

    return "\n".join(formatted)


def _format_context(docs_with_scores: list) -> str:
    """Format retrieved documents into context string."""
    if not docs_with_scores:
        return "No relevant context found."

    parts = []
    for i, (doc, score) in enumerate(docs_with_scores, 1):
        source = doc.metadata.get("disease", doc.metadata.get("source", "Medical KB"))
        parts.append(
            f"[Source {i}: {source} | Relevance: {1 - score:.2f}]\n{doc.page_content}"
        )
    return "\n\n".join(parts)


def _classify_retrieval_need(question: str) -> bool:
    """
    Self-RAG Step 1: Determine if the question needs retrieval.
    Returns True if retrieval is needed.
    """
    try:
        llm = get_llm()
        chain = RETRIEVAL_NEED_PROMPT | llm
        response = chain.invoke({"question": question})
        decision = response.content.strip().upper()
        needs_retrieval = "RETRIEVE" in decision
        logger.info(
            "Retrieval classifier: '%s' → %s",
            question[:50],
            "RETRIEVE" if needs_retrieval else "DIRECT",
        )
        return needs_retrieval
    except Exception as e:
        logger.warning("Retrieval classifier failed, defaulting to RETRIEVE: %s", e)
        return True  # Default to retrieval for safety


def _extract_sources(docs_with_scores: list) -> list[dict]:
    """Extract source metadata from retrieved documents."""
    sources = []
    for doc, score in docs_with_scores:
        sources.append(
            {
                "content": doc.page_content[:300],
                "disease": doc.metadata.get("disease", "General"),
                "relevance_score": round(float(1 - score), 3),
            }
        )
    return sources


async def process_chat(
    message: str,
    session_id: Optional[str] = None,
) -> RAGResult:
    """
    Full Self-RAG pipeline:
    1. Classify if retrieval is needed
    2. Retrieve from vector store (if needed)
    3. Generate response with LLM
    4. Validate groundedness
    5. Fallback if validation fails
    """
    llm = get_llm()

    # Get conversation history
    history = []
    if session_id:
        history = conversation_memory.get_history(session_id)
    chat_history_str = _format_chat_history(history)

    # ── Step 1: Retrieval-need classification ──
    needs_retrieval = _classify_retrieval_need(message)

    if not needs_retrieval or not vector_store_manager.is_loaded:
        # Direct response (no retrieval)
        chain = DIRECT_RESPONSE_PROMPT | llm
        response = chain.invoke(
            {"question": message, "chat_history": chat_history_str}
        )
        answer = response.content

        if session_id:
            conversation_memory.add_turn(session_id, message, answer)

        return RAGResult(
            answer=answer,
            sources=[],
            confidence=0.9,
            needs_professional_review=False,
            used_retrieval=False,
        )

    # ── Step 2: Retrieve from vector store ──
    docs_with_scores = vector_store_manager.retrieve(message, k=RETRIEVAL_TOP_K)

    if not docs_with_scores:
        return RAGResult(
            answer=FALLBACK_RESPONSE,
            sources=[],
            confidence=0.0,
            needs_professional_review=True,
            used_retrieval=True,
        )

    context_str = _format_context(docs_with_scores)
    sources = _extract_sources(docs_with_scores)

    # ── Step 3: Generate response with RAG ──
    chain = MEDICAL_RAG_PROMPT | llm
    response = chain.invoke(
        {
            "question": message,
            "context": context_str,
            "chat_history": chat_history_str,
        }
    )
    answer = response.content

    # ── Step 4: Groundedness validation ──
    grounding_score = check_groundedness(answer, context_str)
    needs_review = grounding_score < GROUNDEDNESS_THRESHOLD

    if needs_review:
        logger.warning(
            "Low groundedness score (%.2f) for query: %s",
            grounding_score,
            message[:50],
        )
        answer = (
            f"{answer}\n\n"
            "---\n"
            "⚠️ **Note**: This response may contain information beyond my verified knowledge base. "
            "Please consult a healthcare professional for confirmation."
        )

    # ── Step 5: Store in memory ──
    if session_id:
        conversation_memory.add_turn(session_id, message, answer)

    return RAGResult(
        answer=answer,
        sources=sources,
        confidence=round(grounding_score, 2),
        needs_professional_review=needs_review,
        used_retrieval=True,
    )


async def process_chat_stream(
    message: str,
    session_id: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Streaming version of the RAG pipeline.
    Yields token-by-token for SSE streaming.
    """
    llm = get_llm()

    # Get conversation history
    history = []
    if session_id:
        history = conversation_memory.get_history(session_id)
    chat_history_str = _format_chat_history(history)

    # Classify retrieval need
    needs_retrieval = _classify_retrieval_need(message)

    if not needs_retrieval or not vector_store_manager.is_loaded:
        chain = DIRECT_RESPONSE_PROMPT | llm
        full_response = ""
        async for chunk in chain.astream(
            {"question": message, "chat_history": chat_history_str}
        ):
            token = chunk.content
            full_response += token
            yield token

        if session_id:
            conversation_memory.add_turn(session_id, message, full_response)
        return

    # Retrieve
    docs_with_scores = vector_store_manager.retrieve(message, k=RETRIEVAL_TOP_K)

    if not docs_with_scores:
        yield FALLBACK_RESPONSE
        return

    context_str = _format_context(docs_with_scores)

    # Stream the RAG response
    chain = MEDICAL_RAG_PROMPT | llm
    full_response = ""
    async for chunk in chain.astream(
        {
            "question": message,
            "context": context_str,
            "chat_history": chat_history_str,
        }
    ):
        token = chunk.content
        full_response += token
        yield token

    if session_id:
        conversation_memory.add_turn(session_id, message, full_response)
