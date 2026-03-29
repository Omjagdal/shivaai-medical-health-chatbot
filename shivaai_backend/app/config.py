import os
from pathlib import Path
from dotenv import load_dotenv

# ─────────────────────────────────────────────
# Base Paths
# ─────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent

# Load .env from shivaai_backend/
load_dotenv(BASE_DIR / ".env")

# ─────────────────────────────────────────────
# Environment & Debug
# ─────────────────────────────────────────────
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
API_VERSION = os.getenv("API_VERSION", "v1")

# ─────────────────────────────────────────────
# Database
# ─────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./shivai.db")

# ─────────────────────────────────────────────
# File Uploads
# ─────────────────────────────────────────────
UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploaded_reports"))
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

TEMP_UPLOAD_DIR = os.getenv("TEMP_UPLOAD_DIR", str(BASE_DIR / "temp_uploads"))
Path(TEMP_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────
# FAISS Vector Store
# ─────────────────────────────────────────────
_faiss_raw = os.getenv("FAISS_INDEX_PATH", "scripts/medical_rag.index")
_meta_raw = os.getenv("METADATA_PATH", "scripts/metadata.json")
FAISS_INDEX_PATH = str(BASE_DIR / _faiss_raw) if not os.path.isabs(_faiss_raw) else _faiss_raw
METADATA_PATH = str(BASE_DIR / _meta_raw) if not os.path.isabs(_meta_raw) else _meta_raw

# ─────────────────────────────────────────────
# LLM & Embeddings
# ─────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "gemini-2.5-flash")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.3"))
EMBEDDING_MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"
)

# ─────────────────────────────────────────────
# RAG Pipeline
# ─────────────────────────────────────────────
MAX_CHUNK_SIZE = int(os.getenv("MAX_CHUNK_SIZE", "500"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "50"))
RETRIEVAL_TOP_K = int(os.getenv("RETRIEVAL_TOP_K", "5"))
GROUNDEDNESS_THRESHOLD = float(os.getenv("GROUNDEDNESS_THRESHOLD", "0.5"))

# ─────────────────────────────────────────────
# Conversation Memory
# ─────────────────────────────────────────────
MAX_MEMORY_TURNS = int(os.getenv("MAX_MEMORY_TURNS", "10"))

# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
_cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")
CORS_ORIGINS = [origin.strip() for origin in _cors_raw.split(",")]