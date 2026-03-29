<h1 align="center">
  🏥 SHIVAAI — AI Medical Assistant
</h1>

<p align="center">
  <em>Production-grade medical AI system with Self-RAG, streaming responses, and hallucination prevention</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/FAISS-0467DF?style=for-the-badge&logo=meta&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| **Self-RAG Pipeline** | LLM-based retrieval classifier → decides when to use KB lookup vs direct response |
| **Groundedness Validation** | Every RAG answer is fact-checked against source documents (0-1 confidence score) |
| **Streaming Responses** | SSE-based real-time token streaming — answers appear character by character |
| **Conversation Memory** | In-memory session-based history with auto-pruning (TTL: 1 hour) |
| **Medical Report Analysis** | PDF upload with OCR fallback for AI-powered report interpretation |
| **Term Simplifier** | Converts complex medical jargon into patient-friendly language |
| **WebSocket Real-Time Chat** | Live bidirectional communication for instant Q&A |
| **Docker Deployment** | Multi-stage Dockerfiles + Docker Compose for one-command deployment |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SHIVAAI Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     SSE/REST     ┌──────────────────────┐ │
│  │   Next.js    │ ◄──────────────► │    FastAPI Backend    │ │
│  │   Frontend   │                  │                      │ │
│  │              │    WebSocket     │  ┌─────────────────┐ │ │
│  │  • Chat UI   │ ◄──────────────► │  │   API Routers   │ │ │
│  │  • Streaming │                  │  │  /chat          │ │ │
│  │  • Upload    │                  │  │  /docs          │ │ │
│  │  • Simplify  │                  │  │  /health        │ │ │
│  └──────────────┘                  │  └────────┬────────┘ │ │
│                                    │           │          │ │
│                                    │  ┌────────▼────────┐ │ │
│                                    │  │  Self-RAG       │ │ │
│                                    │  │  Pipeline       │ │ │
│                                    │  │                 │ │ │
│                                    │  │ 1. Classify     │ │ │
│                                    │  │ 2. Retrieve     │ │ │
│                                    │  │ 3. Generate     │ │ │
│                                    │  │ 4. Validate     │ │ │
│                                    │  │ 5. Fallback     │ │ │
│                                    │  └───┬─────────┬───┘ │ │
│                                    │      │         │     │ │
│                                    │ ┌────▼───┐ ┌───▼───┐ │ │
│                                    │ │ FAISS  │ │Gemini │ │ │
│                                    │ │ Vector │ │ 2.5   │ │ │
│                                    │ │  Store │ │ Flash │ │ │
│                                    │ └────────┘ └───────┘ │ │
│                                    └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI with async Python |
| **AI/LLM** | Google Gemini 2.5 Flash via LangChain |
| **Vector Store** | FAISS (Facebook AI Similarity Search) |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` |
| **Streaming** | Server-Sent Events (SSE) + WebSocket |
| **PDF/OCR** | pdfplumber + Tesseract OCR |
| **Frontend** | Next.js 14 + shadcn/ui + TailwindCSS |
| **Deployment** | Docker + Docker Compose |

---

## 📁 Project Structure

```
shivaai/
├── docker-compose.yml              # Full-stack orchestration
├── .dockerignore
│
├── shivaai_backend/                 # FastAPI Backend
│   ├── Dockerfile
│   ├── .env.example                 # Environment template
│   ├── requirements.txt
│   │
│   ├── app/
│   │   ├── main.py                  # App entry point (lifespan, routers, logging)
│   │   ├── config.py                # Centralized configuration
│   │   │
│   │   ├── core/                    # Core AI initialization
│   │   │   ├── llm.py              # Singleton LLM + embeddings
│   │   │   ├── vector_store.py     # FAISS manager (load/retrieve/add)
│   │   │   ├── memory.py           # Conversation memory (session-based)
│   │   │   └── prompts.py          # All prompt templates
│   │   │
│   │   ├── services/               # Business logic
│   │   │   ├── rag_service.py      # Self-RAG pipeline (classify → retrieve → generate → validate)
│   │   │   └── validation_service.py # Groundedness fact-checker
│   │   │
│   │   ├── routers/                 # API routes
│   │   │   ├── chat.py             # POST /chat (SSE streaming + JSON)
│   │   │   ├── documents.py        # POST /docs/upload, /docs/upload-report
│   │   │   └── health.py           # GET /health
│   │   │
│   │   ├── models/                  # Pydantic schemas
│   │   │   └── schemas.py
│   │   │
│   │   └── data/                    # Medical knowledge base
│   │       └── medical_reports_common.json
│   │
│   └── scripts/                     # Index building
│       └── build_rag_index.py
│
└── frontend/                        # Next.js Frontend
    ├── Dockerfile
    ├── app/
    │   ├── page.tsx                 # Landing page
    │   ├── layout.tsx               # Root layout
    │   └── chat/page.tsx            # Chat page
    │
    ├── components/
    │   ├── chat-interface.tsx       # Main chat (SSE streaming, confidence, sources)
    │   ├── real-time-chat.tsx       # WebSocket real-time chat
    │   ├── report-upload.tsx        # PDF report upload
    │   └── term-simplifier.tsx      # Medical term simplifier
    │
    └── lib/
        └── api.ts                   # API client (REST + SSE + WebSocket)
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Tesseract OCR** (`brew install tesseract` on macOS)
- **Google Gemini API Key** → [Get one here](https://aistudio.google.com/apikey)

### 1. Backend Setup

```bash
cd shivaai_backend

# Create virtual environment
python3 -m venv venv && source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env → set your GEMINI_API_KEY

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. Docker (One Command)

```bash
# Set your API key in shivaai_backend/.env first, then:
docker-compose up --build
```

Open **http://localhost:3000** — you're live! 🎉

---

## 🔌 API Reference

Base URL: `http://localhost:8001/api/v1`

### Chat

```bash
# Non-streaming
curl -X POST http://localhost:8001/api/v1/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the symptoms of diabetes?", "stream": false}'

# Streaming (SSE)
curl -N -X POST http://localhost:8001/api/v1/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain hypertension", "stream": true}'

# With session for conversation memory
curl -X POST http://localhost:8001/api/v1/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me more about the treatment", "session_id": "abc123", "stream": false}'
```

**Response:**

```json
{
  "answer": "Diabetes symptoms include...",
  "sources": [
    {"content": "...", "disease": "Diabetes", "relevance_score": 0.87}
  ],
  "confidence": 0.85,
  "needs_professional_review": false,
  "session_id": "abc123",
  "used_retrieval": true
}
```

### Upload Documents

```bash
curl -X POST http://localhost:8001/api/v1/docs/upload \
  -F "file=@medical_guide.pdf"
```

### Upload Report for Analysis

```bash
curl -X POST http://localhost:8001/api/v1/docs/upload-report \
  -F "file=@blood_test.pdf"
```

### Health Check

```bash
curl http://localhost:8001/api/v1/health
```

**Response:**

```json
{
  "status": "healthy",
  "version": "2.0.0",
  "vector_store_loaded": true,
  "document_count": 1247,
  "llm_available": true,
  "active_sessions": 3,
  "uptime_seconds": 3600.5,
  "environment": "production"
}
```

---

## 🧠 Self-RAG Pipeline

The system implements a 5-step Self-RAG architecture to minimize hallucination:

```
User Query
    │
    ▼
┌─────────────────┐
│ 1. CLASSIFY      │  LLM decides: "Does this need KB retrieval?"
│    (Self-RAG)    │  → RETRIEVE (medical queries)
│                  │  → DIRECT (greetings, clarifications)
└────────┬────────┘
         │
    ▼ (if RETRIEVE)
┌─────────────────┐
│ 2. RETRIEVE      │  FAISS similarity search (top-5 documents)
│    (Vector DB)   │  with relevance scores
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. GENERATE      │  Gemini 2.5 Flash generates answer
│    (RAG + Mem)   │  using context + conversation history
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. VALIDATE      │  LLM fact-checks: is the answer
│    (Grounding)   │  grounded in the retrieved context?
│                  │  → Score: 0.0 to 1.0
└────────┬────────┘
         │
    ▼ (if score < threshold)
┌─────────────────┐
│ 5. FALLBACK      │  Adds safety disclaimer
│    (Safety)      │  "Consult a healthcare professional"
└─────────────────┘
```

---

## 🚢 Deployment Guide

### Render

1. Push your repo to GitHub
2. Create a **Web Service** for the backend:
   - Root: `shivaai_backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Create a **Static Site** or **Web Service** for the frontend:
   - Root: `frontend`
   - Build: `npm install && npm run build`
   - Start: `npm start`
4. Set `NEXT_PUBLIC_API_URL` to your backend URL

### Railway

1. Connect your GitHub repo
2. Railway auto-detects the Dockerfiles
3. Set environment variables in Railway dashboard
4. Deploy — both services auto-scale

### AWS (ECS)

1. Build images: `docker-compose build`
2. Push to ECR: `docker tag` + `docker push`
3. Create ECS task definition with both containers
4. Configure ALB for routing (`:3000` → frontend, `:8001` → backend)
5. Set environment variables in task definition

---

## ⚙️ Environment Variables

All configuration is loaded from `shivaai_backend/.env`.

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | (required) | Google Gemini API key |
| `LLM_MODEL_NAME` | `gemini-2.5-flash` | LLM model identifier |
| `LLM_TEMPERATURE` | `0.3` | Generation temperature |
| `EMBEDDING_MODEL_NAME` | `sentence-transformers/all-MiniLM-L6-v2` | Embedding model |
| `FAISS_INDEX_PATH` | `scripts/medical_rag.index` | FAISS index file path |
| `GROUNDEDNESS_THRESHOLD` | `0.5` | Min score for trusted answers |
| `MAX_MEMORY_TURNS` | `10` | Conversation turns to remember |
| `RETRIEVAL_TOP_K` | `5` | Number of docs to retrieve |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `LOG_LEVEL` | `INFO` | Logging level |
| `ENVIRONMENT` | `development` | Environment name |

> ⚠️ **Important:** Replace `GEMINI_API_KEY` with your own [Google Gemini API key](https://aistudio.google.com/apikey).

---

This project was built for the **OM AI Summit** hackathon and enhanced to production-level quality.

---

<p align="center">
  Built with ❤️ by <strong>Om Jagdale</strong> | Powered by <strong>Gemini AI</strong> + <strong>LangChain</strong> + <strong>FAISS</strong>
</p>
