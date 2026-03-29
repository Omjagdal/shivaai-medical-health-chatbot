"""
Consolidated Pydantic request/response schemas for the ShivaAI API.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ─────────────────────────────────────────────
# Chat
# ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Request body for the /chat endpoint."""
    message: str = Field(..., min_length=1, max_length=5000, description="User's message")
    session_id: Optional[str] = Field(None, description="Session ID for conversation memory")
    stream: bool = Field(False, description="Enable SSE streaming response")


class SourceDocument(BaseModel):
    """A retrieved source document."""
    content: str
    disease: str = "General"
    relevance_score: float = 0.0


class ChatResponse(BaseModel):
    """Response body for the /chat endpoint."""
    answer: str
    sources: List[SourceDocument] = []
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    needs_professional_review: bool = False
    session_id: Optional[str] = None
    used_retrieval: bool = False


# ─────────────────────────────────────────────
# Document Upload
# ─────────────────────────────────────────────

class UploadDocsResponse(BaseModel):
    """Response for document upload."""
    filename: str
    chunks_added: int
    message: str


class ReportAnalysisResponse(BaseModel):
    """Response for medical report analysis."""
    filename: str
    analysis: str


# ─────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────

class HealthResponse(BaseModel):
    """System health check response."""
    status: str = "healthy"
    version: str = "2.0.0"
    vector_store_loaded: bool = False
    document_count: int = 0
    llm_available: bool = False
    active_sessions: int = 0
    uptime_seconds: float = 0.0
    environment: str = "development"


# ─────────────────────────────────────────────
# Term Simplification
# ─────────────────────────────────────────────

class SimplifyTermRequest(BaseModel):
    """Request for term simplification."""
    term: str = Field(..., min_length=1, max_length=500)


class SimplifyTermResponse(BaseModel):
    """Response for term simplification."""
    term: str
    simplified: str


# ─────────────────────────────────────────────
# Legacy Compatibility
# ─────────────────────────────────────────────

class LegacyQuestionResponse(BaseModel):
    """Legacy response format for backward compatibility."""
    question: str
    llm_answer: str
    retrieved_docs: List[dict] = []
