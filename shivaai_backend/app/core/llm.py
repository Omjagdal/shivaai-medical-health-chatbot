"""
Singleton LLM and Embedding model initialization.
Loaded once on application startup and reused across all services.
"""

import logging
from functools import lru_cache

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.embeddings import HuggingFaceEmbeddings

from app.config import (
    GEMINI_API_KEY,
    LLM_MODEL_NAME,
    LLM_TEMPERATURE,
    EMBEDDING_MODEL_NAME,
)

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_llm() -> ChatGoogleGenerativeAI:
    """Return a singleton instance of the Gemini LLM."""
    logger.info("Initializing LLM: %s", LLM_MODEL_NAME)
    return ChatGoogleGenerativeAI(
        model=LLM_MODEL_NAME,
        google_api_key=GEMINI_API_KEY,
        temperature=LLM_TEMPERATURE,
        streaming=True,
    )


@lru_cache(maxsize=1)
def get_embeddings() -> HuggingFaceEmbeddings:
    """Return a singleton instance of the embedding model."""
    logger.info("Initializing embedding model: %s", EMBEDDING_MODEL_NAME)
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL_NAME,
    )
