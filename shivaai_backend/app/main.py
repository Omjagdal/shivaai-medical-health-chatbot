"""
SHIVAAI — AI Public Health Chatbot
Main FastAPI application with lifespan context, structured logging, and versioned API.
"""

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.config import CORS_ORIGINS, LOG_LEVEL, API_VERSION, ENVIRONMENT
from app.core.llm import get_llm, get_embeddings
from app.core.vector_store import vector_store_manager
from app.routers import chat, documents, health


# ─────────────────────────────────────────────
# Logging Configuration
# ─────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("shivaai")


# ─────────────────────────────────────────────
# Application Lifespan
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and tear down application resources."""
    startup_time = time.time()
    logger.info("🚀 Starting SHIVAAI v2.0.0 (%s)", ENVIRONMENT)

    # Initialize LLM and embeddings
    try:
        llm = get_llm()
        embeddings = get_embeddings()
        logger.info("✅ LLM and embeddings initialized")
    except Exception as e:
        logger.error("❌ Failed to initialize LLM/embeddings: %s", e)
        embeddings = None

    # Load vector store
    if embeddings:
        loaded = vector_store_manager.load(embeddings)
        if loaded:
            logger.info(
                "✅ Vector store loaded: %d documents",
                vector_store_manager.document_count,
            )
        else:
            logger.warning("⚠️ Vector store not loaded — RAG will be unavailable")

    elapsed = time.time() - startup_time
    logger.info("🏥 SHIVAAI ready in %.1fs", elapsed)

    yield  # Application runs here

    logger.info("👋 Shutting down SHIVAAI")


# ─────────────────────────────────────────────
# FastAPI Application
# ─────────────────────────────────────────────
app = FastAPI(
    title="SHIVAAI — AI Medical Assistant",
    description=(
        "Production-grade medical AI assistant with RAG, Self-RAG validation, "
        "conversation memory, and streaming responses."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─────────────────────────────────────────────
# CORS Middleware
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# API v1 Routers
# ─────────────────────────────────────────────
api_prefix = f"/api/{API_VERSION}"

app.include_router(chat.router, prefix=api_prefix)
app.include_router(documents.router, prefix=api_prefix)
app.include_router(health.router, prefix=api_prefix)


# ─────────────────────────────────────────────
# Root Endpoint
# ─────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "name": "SHIVAAI — AI Medical Assistant",
        "version": "2.0.0",
        "docs": "/docs",
        "health": f"{api_prefix}/health",
        "chat": f"{api_prefix}/chat/",
    }


# ─────────────────────────────────────────────
# Legacy Backward-Compatible Endpoints
# ─────────────────────────────────────────────
@app.post("/ask-question/")
async def legacy_ask_question(question: str = Form(...)):
    """Legacy endpoint — redirects to new RAG pipeline."""
    from app.services.rag_service import process_chat

    result = await process_chat(question)
    return {
        "question": question,
        "llm_answer": result.answer,
        "retrieved_docs": [
            {
                "disease": s.get("disease", "General"),
                "info": s.get("content", ""),
                "score": s.get("relevance_score", 0.0),
            }
            for s in result.sources
        ],
    }


@app.post("/upload-report/")
async def legacy_upload_report(file: UploadFile = File(...)):
    """Legacy endpoint — redirects to new report analysis."""
    from app.routers.documents import upload_report

    return await upload_report(file)


@app.post("/simplify-term/")
async def legacy_simplify_term(term: str = Form(...)):
    """Legacy endpoint — redirects to new term simplification."""
    from app.routers.documents import simplify_term

    return await simplify_term(term)


# Legacy WebSocket for backward compatibility
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/disease_info")
async def legacy_websocket(websocket: WebSocket):
    """Legacy WebSocket — uses new RAG pipeline."""
    from app.services.rag_service import process_chat

    await websocket.accept()
    try:
        while True:
            query = await websocket.receive_text()
            result = await process_chat(query)
            response = {
                "question": query,
                "llm_answer": result.answer,
                "retrieved_docs": [s.get("content", "") for s in result.sources],
            }
            await websocket.send_json(response)
    except WebSocketDisconnect:
        logger.info("Legacy WebSocket client disconnected")
    except Exception as e:
        logger.error("Legacy WebSocket error: %s", e)


# ─────────────────────────────────────────────
# Run
# ─────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
    )
