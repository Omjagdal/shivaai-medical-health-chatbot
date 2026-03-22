import json
from pathlib import Path

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

from app.config import FAISS_INDEX_PATH


# ----------------------------------------
# 1. Load Disease Dataset
# ----------------------------------------
data_path = Path(__file__).parent.parent / "app" / "data" / "medical_reports_common.json"

with open(data_path, "r", encoding="utf-8") as f:
    diseases = json.load(f)

if not diseases:
    raise ValueError("Dataset is empty")

print(f"Loaded {len(diseases)} records")


# ----------------------------------------
# 2. Convert into LangChain Documents
# ----------------------------------------
documents = []

for idx, d in enumerate(diseases):

    text = (
        d.get("full_text")
        or d.get("description")
        or ""
    ).strip()

    if not text:
        continue

    doc = Document(
        page_content=text,
        metadata={
            "id": idx,
            "disease": d.get("disease", "Unknown")
        }
    )

    documents.append(doc)

if not documents:
    raise ValueError("No valid records found")

print(f"Prepared {len(documents)} LangChain documents")


# ----------------------------------------
# 3. Create Embedding Model
# ----------------------------------------
print("Loading embedding model...")

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


# ----------------------------------------
# 4. Build FAISS Vector Store
# ----------------------------------------
print("Building FAISS vector store...")

vectorstore = FAISS.from_documents(
    documents,
    embeddings
)


# ----------------------------------------
# 5. Save Vector Store
# ----------------------------------------
from pathlib import Path as _P
_index_path = _P(FAISS_INDEX_PATH)
vectorstore.save_local(
    folder_path=str(_index_path.parent),
    index_name=_index_path.stem
)

print(f"Vector store saved at {_index_path.parent} (index: {_index_path.stem})")
print("✅ RAG Index Build Complete")
