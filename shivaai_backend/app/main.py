from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from pathlib import Path
import faiss

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.docstore.in_memory import InMemoryDocstore

from .config import UPLOAD_DIR, FAISS_INDEX_PATH, GEMINI_API_KEY
from .chatbot import simplify_terms, analyze_report


# -------------------------
# FASTAPI INIT
# -------------------------
app = FastAPI(
    title="SHIVAAI - AI Public Health Chatbot",
    version="2.0.0"
)

# -------------------------
# CORS
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(UPLOAD_DIR, exist_ok=True)

# -------------------------
# LLM SETUP
# -------------------------
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=GEMINI_API_KEY,
    temperature=0.3
)

# -------------------------
# VECTOR STORE + RETRIEVER
# -------------------------
vectorstore = None
retriever = None

print(f"📂 Looking for FAISS index at: {FAISS_INDEX_PATH}")
print(f"📂 Looking for metadata at: {Path(FAISS_INDEX_PATH).exists()}")

try:
    if Path(FAISS_INDEX_PATH).exists():
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        raw_index = faiss.read_index(str(FAISS_INDEX_PATH))
        
        vectorstore = FAISS.load_local(
            folder_path=str(Path(FAISS_INDEX_PATH).parent),
            embeddings=embeddings,
            index_name=Path(FAISS_INDEX_PATH).stem,
            allow_dangerous_deserialization=True
        )

        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        print("✅ FAISS index loaded successfully")
    else:
        print(f"⚠️ FAISS index not found at: {FAISS_INDEX_PATH}")
except Exception as e:
    print(f"⚠️ Failed to load FAISS index: {e}")


# -------------------------
# RAG PROMPT
# -------------------------
rag_prompt = PromptTemplate(
    input_variables=["question", "context"],
    template="""
You are a helpful medical assistant.

Question:
{question}

Relevant Medical Information:
{context}

Provide an informative answer.
"""
)


# -------------------------
# RAG FUNCTION
# -------------------------
def rag_answer(question):

    if retriever is None:
        return "The medical knowledge base is not loaded yet. Please try again later.", []

    try:
        docs = retriever.invoke(question)
        context = "\n".join([d.page_content for d in docs])

        chain = rag_prompt | llm

        response = chain.invoke({
            "question": question,
            "context": context
        })

        return response.content, docs
    except Exception as e:
        print(f"❌ RAG error: {e}")
        return f"Sorry, an error occurred while processing your question: {str(e)}", []


# -------------------------
# HOME
# -------------------------
@app.get("/")
def home():
    return {"message": "Welcome to SHIVAAI LangChain API"}


# -------------------------
# Upload Report
# -------------------------
@app.post("/upload-report/")
async def upload_report(file: UploadFile = File(...)):

    file_location = str(Path(UPLOAD_DIR) / file.filename)

    with open(file_location, "wb") as f:
        f.write(await file.read())

    analysis = analyze_report(file_location)

    return {
        "filename": file.filename,
        "analysis": analysis
    }


# -------------------------
# Ask Medical Question
# -------------------------
@app.post("/ask-question/")
async def ask_question(question: str = Form(...)):

    answer, docs = rag_answer(question)

    retrieved_docs = [
        {
            "disease": doc.metadata.get("disease", "General"),
            "info": doc.page_content,
            "score": 0.0
        }
        for doc in docs
    ]

    return {
        "question": question,
        "llm_answer": answer,
        "retrieved_docs": retrieved_docs
    }


# -------------------------
# Simplify Term
# -------------------------
@app.post("/simplify-term/")
async def simplify_term(term: str = Form(...)):
    return {
        "term": term,
        "simplified": simplify_terms(term)
    }


# -------------------------
# WEBSOCKET (REALTIME CHAT)
# -------------------------
@app.websocket("/ws/disease_info")
async def websocket_disease_info(websocket: WebSocket):

    await websocket.accept()

    try:
        while True:

            query = await websocket.receive_text()

            answer, docs = rag_answer(query)

            response = {
                "question": query,
                "llm_answer": answer,
                "retrieved_docs": [
                    d.page_content for d in docs
                ]
            }

            await websocket.send_json(response)

    except WebSocketDisconnect:
        print("Client disconnected")

    except Exception as e:
        await websocket.send_text(str(e))


# -------------------------
# RUN SERVER
# -------------------------
if __name__ == "__main__":

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
