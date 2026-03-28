# 🏥 SHIVAAI — AI Public Health Chatbot

> An AI-powered medical assistant built with **FastAPI**, **Google Gemini**, **LangChain**, and **FAISS** for intelligent health consultations, medical report analysis, and real-time chat.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI (Python) |
| **AI/LLM** | Google Gemini 2.5 Flash via LangChain |
| **Vector DB** | FAISS (Facebook AI Similarity Search) |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` |
| **PDF Parsing** | pdfplumber + pytesseract (OCR) |
| **Database** | SQLite via SQLAlchemy |
| **Frontend** | Next.js 14 + shadcn/ui + TailwindCSS |

---

## 🗂️ Project Structure

```
om-ai-summit-main/
├── frontend/                        # Next.js frontend
│   ├── app/
│   │   ├── page.tsx                 # Home page (renders HomeHero)
│   │   ├── layout.tsx               # Root layout with Geist fonts
│   │   ├── globals.css              # Global styles
│   │   └── chat/
│   │       └── page.tsx             # Chat page
│   ├── components/
│   │   ├── home-hero.tsx            # Landing page hero section
│   │   ├── chat-interface.tsx       # Chat UI component
│   │   ├── real-time-chat.tsx       # WebSocket real-time chat
│   │   ├── report-upload.tsx        # PDF report upload component
│   │   ├── term-simplifier.tsx      # Medical term simplifier
│   │   └── ui/                      # shadcn/ui components
│   ├── package.json
│   └── tsconfig.json
│
└── shivaai_backend/                 # FastAPI backend
    ├── .env                         # Environment variables
    ├── requirements.txt             # Python dependencies
    ├── readme.md                    # ← You are here
    │
    ├── app/
    │   ├── __init__.py
    │   ├── main.py                  # FastAPI app entry point & API routes
    │   ├── config.py                # Configuration loader (.env)
    │   ├── chatbot.py               # Core chatbot logic (RAG, report analysis)
    │   │
    │   ├── routers/                 # API route modules
    │   │   ├── chat.py              # POST /chat/ — structured chat endpoint
    │   │   ├── reports.py           # GET/POST /reports/ — report management
    │   │   └── upload.py            # POST /upload/report — PDF upload & extraction
    │   │
    │   ├── models/                  # Pydantic request/response models
    │   │   ├── chat_models.py
    │   │   └── reports_model.py
    │   │
    │   ├── services/                # Business logic services
    │   │   ├── chatbot.py           # Chatbot service layer
    │   │   ├── embeddings.py        # Embedding generation
    │   │   ├── pdf_pasrser.py       # PDF text extraction service
    │   │   ├── simplifer.py         # Medical term simplification
    │   │   └── vector_utlis.py      # Vector store utilities
    │   │
    │   ├── database/                # Database layer
    │   │   ├── db.py                # SQLAlchemy engine & session
    │   │   └── models.py            # ORM models (Report, ChatHistory, etc.)
    │   │
    │   ├── utils/                   # Utility functions
    │   │   ├── db_utlis.py          # Database helpers
    │   │   ├── file_utils.py        # File I/O helpers
    │   │   └── text_utils.py        # Text processing helpers
    │   │
    │   ├── data/                    # Static datasets
    │   │   ├── medical_reports_common.json   # Medical knowledge base
    │   │   └── metadata.json
    │   │
    │   └── scripts/                 # Internal setup scripts
    │       ├── steup_vector_db.py   # Vector DB initialization
    │       └── update_embeddings.py # Embedding update script
    │
    ├── scripts/                     # Top-level tooling
    │   ├── build_rag_index.py       # Build FAISS index from dataset
    │   ├── medical_rag.index        # Pre-built FAISS index
    │   └── metadata.json            # Index metadata
    │
    ├── uploaded_reports/            # Stored uploaded PDF reports
    └── temp_uploads/                # Temporary upload processing dir
```

---

## 🚀 API Endpoints

### REST Endpoints (defined in `app/main.py`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check — returns welcome message |
| `POST` | `/upload-report/` | Upload a PDF medical report for AI analysis |
| `POST` | `/ask-question/` | Ask a medical question using RAG |
| `POST` | `/simplify-term/` | Simplify a medical term into plain language |

### WebSocket Endpoint

| Protocol | Endpoint | Description |
|---|---|---|
| `WS` | `/ws/disease_info` | Real-time medical Q&A via WebSocket |

---

## ⚙️ Environment Variables

All configuration is loaded from `shivaai_backend/.env`:

```env
DATABASE_URL=sqlite:///./shivai.db
UPLOAD_DIR=uploaded_reports
FAISS_INDEX_PATH=scripts/medical_rag.index
METADATA_PATH=scripts/metadata.json
GEMINI_API_KEY=<your-gemini-api-key>
MAX_CHUNK_SIZE=500
CHUNK_OVERLAP=50
DEBUG=True
ENVIRONMENT=development
```

> ⚠️ **Important:** Replace `GEMINI_API_KEY` with your own [Google Gemini API key](https://aistudio.google.com/apikey).

---

## 🛠️ How to Run the Project

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- **Tesseract OCR** (for PDF image-based text extraction)

#### Install Tesseract (macOS):
```bash
brew install tesseract
```

---

### 1. Backend Setup

```bash
# Navigate to the project root
cd /Users/shivaai/Desktop/SHIVAAI/om-ai-summit-main

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r shivaai_backend/requirements.txt

# Also install LangChain dependencies (not listed in requirements.txt)
pip install langchain langchain-google-genai langchain-community python-dotenv sqlalchemy

# Navigate to the backend directory and start the server
cd shivaai_backend
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

The backend will be live at: **http://localhost:8001**  
API docs (Swagger UI): **http://localhost:8001/docs**

---

### 2. Frontend Setup

```bash
# Open a new terminal
cd /Users/shivaai/Desktop/SHIVAAI/om-ai-summit-main/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be live at: **http://localhost:3000**

---

### 3. (Optional) Rebuild the FAISS Index

If you modify the medical dataset, rebuild the vector index:

```bash
cd /Users/shivaai/Desktop/SHIVAAI/om-ai-summit-main/shivaai_backend
python -m scripts.build_rag_index
```

---

## 🧪 Quick Test

Once both servers are running, test the backend API:

```bash
# Health check
curl http://localhost:8001/

# Ask a medical question
curl -X POST http://localhost:8001/ask-question/ -F "question=What are the symptoms of diabetes?"

# Simplify a medical term
curl -X POST http://localhost:8001/simplify-term/ -F "term=Hypertension"

# Upload a PDF report
curl -X POST http://localhost:8001/upload-report/ -F "file=@/path/to/your/report.pdf"
```

---

## 🔑 Key Features

- **🤖 RAG-based Medical Q&A** — Retrieval-Augmented Generation using FAISS + Gemini
- **📄 PDF Report Analysis** — Upload medical reports (PDF) for AI-powered insights with OCR support
- **💬 Real-time WebSocket Chat** — Live medical consultations via WebSocket
- **🔬 Medical Term Simplifier** — Break down complex medical jargon into plain language
- **🗃️ Report Management** — Store, list, and download uploaded reports


---


