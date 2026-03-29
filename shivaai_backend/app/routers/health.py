"""
Health router — /api/v1/health
System health check and status endpoint.
"""

import logging
import time

from fastapi import APIRouter

from app.models.schemas import HealthResponse
from app.core.vector_store import vector_store_manager
from app.core.memory import conversation_memory
from app.config import ENVIRONMENT

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])

# Recorded at module import time (effectively at startup)
_start_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    System health check endpoint.
    Returns the operational status of all core components.
    """
    # Check LLM availability
    llm_available = False
    try:
        from app.core.llm import get_llm
        llm = get_llm()
        llm_available = llm is not None
    except Exception:
        pass

    vs_loaded = vector_store_manager.is_loaded
    status = "healthy" if (vs_loaded and llm_available) else "degraded"

    return HealthResponse(
        status=status,
        version="2.0.0",
        vector_store_loaded=vs_loaded,
        document_count=vector_store_manager.document_count,
        llm_available=llm_available,
        active_sessions=conversation_memory.active_sessions,
        uptime_seconds=round(time.time() - _start_time, 1),
        environment=ENVIRONMENT,
    )
