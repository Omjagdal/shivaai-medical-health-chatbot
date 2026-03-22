# 🏥 Shivaai Medical Health Chatbot

An intelligent RAG (Retrieval-Augmented Generation) based medical health chatbot powered by vector databases and advanced NLP. Shivaai provides accurate, context-aware medical information and health assistance using state-of-the-art AI technology.

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![LangChain](https://img.shields.io/badge/LangChain-Latest-green.svg)](https://langchain.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-orange.svg)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [RAG Pipeline](#rag-pipeline)
- [Vector Database](#vector-database)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)
- [License](#license)

## 🌟 Overview

Shivaai is a sophisticated medical health chatbot that leverages Retrieval-Augmented Generation (RAG) technology to provide accurate and contextual medical information. By combining vector databases with large language models, Shivaai can understand complex medical queries and retrieve relevant information from a comprehensive knowledge base.

### Key Capabilities
- 🩺 Medical symptom analysis and information
- 💊 Medication guidance and drug interactions
- 🏥 Disease information and prevention tips
- 📊 Health metrics interpretation
- 🔍 Context-aware medical Q&A
- 📚 Evidence-based responses from medical literature

## ✨ Features

### Core Features
- **RAG-Based Architecture**: Retrieves relevant medical information before generating responses
- **Vector Database Integration**: Fast and accurate semantic search using embeddings
- **Contextual Understanding**: Maintains conversation context for multi-turn dialogues
- **Medical Knowledge Base**: Comprehensive database of medical conditions, symptoms, and treatments
- **Real-time Responses**: Low-latency query processing and response generation
- **Multi-language Support**: Supports multiple languages for global accessibility

### Advanced Features
- **Symptom Checker**: Analyze symptoms and suggest possible conditions
- **Drug Interaction Checker**: Check for potential medication interactions
- **Health Record Integration**: Store and reference patient history (with privacy compliance)
- **Citation & Sources**: Provides references for medical information
- **Confidence Scoring**: Indicates reliability of responses
- **Emergency Detection**: Identifies urgent medical situations

### Safety Features
- **Medical Disclaimer Generation**: Automatic disclaimer for medical advice
- **Emergency Routing**: Redirects critical cases to emergency services
- **Privacy Protection**: HIPAA-compliant data handling
- **Content Filtering**: Filters inappropriate or harmful content

## 🏗️ Architecture

### RAG Pipeline Flow
```
User Query → Query Processing → Embedding Generation → Vector Search
    ↓
Retrieved Documents ← Vector Database (Medical Knowledge)
    ↓
Context + Query → LLM (GPT-4/Claude) → Response Generation
    ↓
Post-Processing → Citation Addition → Final Response
```

### System Components

1. **Query Processor**: Cleans and prepares user input
2. **Embedding Model**: Converts text to vector representations
3. **Vector Database**: Stores and retrieves medical document embeddings
4. **LLM Engine**: Generates human-like responses
5. **Response Handler**: Formats and validates outputs

## 🚀 Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager
- OpenAI API key or alternative LLM API
- Vector database (Pinecone/Chroma/FAISS)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/shivaai-medical-chatbot.git
cd shivaai-medical-chatbot
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

5. **Initialize vector database**
```bash
python scripts/initialize_vectordb.py
```

6. **Run the application**
```bash
# For web interface
streamlit run app.py

# For API server
python api_server.py
```

## 💻 Usage

### Web Interface

1. Open browser at `http://localhost:8501`
2. Type your medical question in the chat interface
3. Receive AI-powered responses with sources
4. Continue conversation for follow-up questions

### Command Line Interface
```bash
python cli.py --query "What are the symptoms of diabetes?"
```

### API Usage
```python
import requests

url = "http://localhost:8000/chat"
payload = {
    "query": "What are the symptoms of hypertension?",
    "session_id": "user123",
    "include_sources": True
}

response = requests.post(url, json=payload)
result = response.json()

print(f"Churn Prediction: {result['prediction']}")
print(f"Probability: {result['probability']:.2%}")
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:
```env
# LLM Configuration
OPENAI_API_KEY=your_openai_api_key
MODEL_NAME=gpt-4
TEMPERATURE=0.3
MAX_TOKENS=1000

# Vector Database Configuration
VECTOR_DB_TYPE=pinecone  # Options: pinecone, chroma, faiss
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=us-west1-gcp
INDEX_NAME=shivaai-medical

# Embedding Model
EMBEDDING_MODEL=text-embedding-ada-002
EMBEDDING_DIMENSION=1536

# RAG Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RESULTS=5
SIMILARITY_THRESHOLD=0.7

# Application Settings
APP_PORT=8501
DEBUG_MODE=False
LOG_LEVEL=INFO
```

### Medical Knowledge Base

Add your medical documents to the `data/medical_docs/` directory:
- PDF format: Medical textbooks, research papers
- JSON format: Structured medical data
- TXT format: Medical articles and guidelines

## 🔄 RAG Pipeline

### Document Processing
```python
from shivaai.rag import DocumentProcessor

# Initialize processor
processor = DocumentProcessor(
    chunk_size=1000,
    chunk_overlap=200
)

# Process documents
documents = processor.load_documents("data/medical_docs/")
chunks = processor.split_documents(documents)
embeddings = processor.generate_embeddings(chunks)

# Store in vector database
vector_db.add_documents(chunks, embeddings)
```

### Query Processing
```python
from shivaai.rag import RAGPipeline

# Initialize RAG pipeline
rag = RAGPipeline(
    vector_db=vector_db,
    llm_model="gpt-4",
    top_k=5
)

# Process query
response = rag.query(
    question="What are the symptoms of diabetes?",
    include_sources=True
)

print(response.answer)
print(response.sources)
```

## 🗄️ Vector Database

### Supported Databases

| Database | Description | Best For |
|----------|-------------|----------|
| **Pinecone** | Cloud-native vector database | Production, scalability |
| **Chroma** | Open-source embedding database | Development, local testing |
| **FAISS** | Facebook AI similarity search | High-performance, offline |
| **Weaviate** | Open-source vector search engine | Self-hosted production |

### Vector Database Setup

#### Pinecone
```python
import pinecone

pinecone.init(
    api_key="YOUR_API_KEY",
    environment="us-west1-gcp"
)

index = pinecone.Index("shivaai-medical")
```

#### Chroma
```python
import chromadb

client = chromadb.Client()
collection = client.create_collection("shivaai-medical")
```

#### FAISS
```python
import faiss
from langchain.vectorstores import FAISS

vector_store = FAISS.from_documents(
    documents=chunks,
    embedding=embeddings
)
```

## 📡 API Documentation

### Endpoints

#### 1. Chat Endpoint
```http
POST /api/chat
Content-Type: application/json

{
  "query": "What are the symptoms of diabetes?",
  "session_id": "user123",
  "include_sources": true,
  "max_tokens": 500
}
```

**Response:**
```json
{
  "answer": "Diabetes symptoms include...",
  "sources": [
    {
      "title": "Diabetes Overview",
      "content": "...",
      "relevance_score": 0.92
    }
  ],
  "confidence": 0.89,
  "disclaimer": "This information is for educational purposes..."
}
```

#### 2. Symptom Checker
```http
POST /api/symptom-check
Content-Type: application/json

{
  "symptoms": ["fever", "cough", "fatigue"],
  "duration": "3 days",
  "severity": "moderate"
}
```

#### 3. Drug Interaction Checker
```http
POST /api/drug-interaction
Content-Type: application/json

{
  "medications": ["aspirin", "ibuprofen"]
}
```

## 📂 Project Structure
```
shivaai-medical-chatbot/
│
├── app.py                          # Main Streamlit application
├── api_server.py                   # FastAPI server
├── cli.py                          # Command-line interface
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variables template
├── README.md                       # Project documentation
│
├── shivaai/
│   ├── __init__.py
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── pipeline.py            # RAG pipeline implementation
│   │   ├── embeddings.py          # Embedding generation
│   │   ├── retriever.py           # Document retrieval
│   │   └── generator.py           # Response generation
│   │
│   ├── vectordb/
│   │   ├── __init__.py
│   │   ├── pinecone_db.py         # Pinecone integration
│   │   ├── chroma_db.py           # Chroma integration
│   │   └── faiss_db.py            # FAISS integration
│   │
│   ├── llm/
│   │   ├── __init__.py
│   │   ├── openai_client.py       # OpenAI integration
│   │   ├── claude_client.py       # Anthropic Claude
│   │   └── prompts.py             # System prompts
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── text_processing.py     # Text utilities
│   │   ├── validators.py          # Input validation
│   │   └── logger.py              # Logging configuration
│   │
│   └── models/
│       ├── __init__.py
│       ├── schemas.py             # Pydantic models
│       └── response.py            # Response models
│
├── data/
│   ├── medical_docs/              # Medical knowledge base
│   ├── embeddings/                # Cached embeddings
│   └── sample_data/               # Sample medical data
│
├── scripts/
│   ├── initialize_vectordb.py     # Setup vector database
│   ├── ingest_documents.py        # Document ingestion
│   ├── update_knowledge_base.py   # Update medical data
│   └── benchmark.py               # Performance testing
│
├── tests/
│   ├── test_rag.py
│   ├── test_vectordb.py
│   ├── test_llm.py
│   └── test_api.py
│
├── docs/
│   ├── api_reference.md
│   ├── deployment_guide.md
│   ├── medical_sources.md
│   └── privacy_policy.md
│
└── notebooks/
    ├── rag_exploration.ipynb
    ├── embedding_analysis.ipynb
    └── performance_tuning.ipynb
```

## 🛠️ Technologies Used

### Core Technologies
| Component | Technology |
|-----------|-----------|
| **LLM Framework** | LangChain, LlamaIndex |
| **Language Models** | OpenAI GPT-4, Anthropic Claude |
| **Embeddings** | OpenAI Ada-002, Sentence Transformers |
| **Vector Database** | Pinecone, Chroma, FAISS |
| **Web Framework** | Streamlit, FastAPI |
| **Data Processing** | Pandas, NumPy |

### Supporting Libraries
- **Document Loaders**: PyPDF2, python-docx, BeautifulSoup
- **Text Processing**: spaCy, NLTK
- **API Development**: FastAPI, Pydantic
- **Testing**: pytest, unittest
- **Deployment**: Docker, Kubernetes

## 📦 Dependencies
```txt
# Core Dependencies
langchain>=0.1.0
openai>=1.0.0
pinecone-client>=2.2.0
chromadb>=0.4.0
faiss-cpu>=1.7.4
sentence-transformers>=2.2.0

# Web Framework
streamlit>=1.28.0
fastapi>=0.104.0
uvicorn>=0.24.0

# Document Processing
pypdf2>=3.0.0
python-docx>=0.8.11
beautifulsoup4>=4.12.0

# NLP
spacy>=3.7.0
nltk>=3.8.0

# Data Processing
pandas>=2.0.0
numpy>=1.24.0

# Utilities
python-dotenv>=1.0.0
pydantic>=2.0.0
requests>=2.31.0
```

## 🎯 Features Roadmap

- [x] Basic RAG pipeline with vector search
- [x] Multi-turn conversation support
- [x] Medical knowledge base integration
- [ ] Voice input/output support
- [ ] Multi-modal support (images, reports)
- [ ] Personalized health tracking
- [ ] Integration with wearable devices
- [ ] Telemedicine appointment booking
- [ ] Prescription management
- [ ] Health insurance integration

## ⚠️ Disclaimer

**IMPORTANT MEDICAL DISCLAIMER:**

Shivaai is an AI-powered informational tool and **NOT a substitute for professional medical advice, diagnosis, or treatment**. 

- Always seek the advice of your physician or qualified health provider
- Never disregard professional medical advice or delay seeking it
- In case of emergency, call your local emergency number immediately
- This chatbot is for educational and informational purposes only
- AI responses may contain errors or inaccuracies

**Privacy & Compliance:**
- This application complies with HIPAA regulations
- No personal health information is stored without consent
- All data is encrypted in transit and at rest

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Areas
- Adding medical knowledge sources
- Improving RAG accuracy
- Enhancing UI/UX
- Adding new features
- Bug fixes and testing
- Documentation improvements

