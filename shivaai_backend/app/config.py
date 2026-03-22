import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory (shivaai_backend/)
BASE_DIR = Path(__file__).parent.parent

# Load environment variables from .env (in shivaai_backend/)
load_dotenv(BASE_DIR / ".env")

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./shivai.db")

# Upload directory for PDF reports
UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploaded_reports"))
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

# Temp upload directory (for processing)
TEMP_UPLOAD_DIR = os.getenv("TEMP_UPLOAD_DIR", str(BASE_DIR / "temp_uploads"))
Path(TEMP_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

# FAISS Vector Database Paths — resolve relative to BASE_DIR
_faiss_raw = os.getenv("FAISS_INDEX_PATH", "scripts/medical_rag.index")
_meta_raw = os.getenv("METADATA_PATH", "scripts/metadata.json")
FAISS_INDEX_PATH = str(BASE_DIR / _faiss_raw) if not os.path.isabs(_faiss_raw) else _faiss_raw
METADATA_PATH = str(BASE_DIR / _meta_raw) if not os.path.isabs(_meta_raw) else _meta_raw

# Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Other Configurations
MAX_CHUNK_SIZE = int(os.getenv("MAX_CHUNK_SIZE", 500))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", 50))

# Debug / Environment
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")