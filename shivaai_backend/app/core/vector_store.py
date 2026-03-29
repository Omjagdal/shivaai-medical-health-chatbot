"""
Centralized FAISS vector store manager.
Handles loading, querying, and dynamic document addition.
"""

import logging
from pathlib import Path
from typing import List, Tuple, Optional

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import FAISS_INDEX_PATH, MAX_CHUNK_SIZE, CHUNK_OVERLAP

logger = logging.getLogger(__name__)


class VectorStoreManager:
    """
    Manages a FAISS vector store lifecycle:
    - Load from disk on startup
    - Retrieve relevant documents with similarity scores
    - Add new documents from uploaded files
    """

    def __init__(self):
        self._vectorstore: Optional[FAISS] = None
        self._retriever = None
        self._text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=MAX_CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    @property
    def is_loaded(self) -> bool:
        return self._vectorstore is not None

    @property
    def document_count(self) -> int:
        if self._vectorstore is None:
            return 0
        try:
            return self._vectorstore.index.ntotal
        except Exception:
            return 0

    def load(self, embeddings) -> bool:
        """Load FAISS index from disk. Returns True on success."""
        index_path = Path(FAISS_INDEX_PATH)
        if not index_path.exists():
            logger.warning("FAISS index not found at %s", FAISS_INDEX_PATH)
            return False

        try:
            self._vectorstore = FAISS.load_local(
                folder_path=str(index_path.parent),
                embeddings=embeddings,
                index_name=index_path.stem,
                allow_dangerous_deserialization=True,
            )
            self._retriever = self._vectorstore.as_retriever(
                search_kwargs={"k": 5}
            )
            logger.info(
                "FAISS index loaded: %d vectors", self._vectorstore.index.ntotal
            )
            return True
        except Exception as e:
            logger.error("Failed to load FAISS index: %s", e)
            return False

    def retrieve(
        self, query: str, k: int = 5
    ) -> List[Tuple[Document, float]]:
        """
        Retrieve top-k relevant documents with similarity scores.
        Returns list of (Document, score) tuples.
        """
        if self._vectorstore is None:
            logger.warning("Vector store not loaded, returning empty results")
            return []

        try:
            results = self._vectorstore.similarity_search_with_score(query, k=k)
            return results
        except Exception as e:
            logger.error("Retrieval error: %s", e)
            return []

    def add_documents(
        self, texts: List[str], metadatas: Optional[List[dict]] = None
    ) -> int:
        """
        Chunk and add new documents to the vector store.
        Returns the number of chunks added.
        """
        if self._vectorstore is None:
            raise RuntimeError("Vector store not initialized")

        documents = []
        for i, text in enumerate(texts):
            meta = metadatas[i] if metadatas and i < len(metadatas) else {}
            chunks = self._text_splitter.split_text(text)
            for chunk in chunks:
                documents.append(Document(page_content=chunk, metadata=meta))

        if not documents:
            return 0

        self._vectorstore.add_documents(documents)

        # Persist to disk
        index_path = Path(FAISS_INDEX_PATH)
        self._vectorstore.save_local(
            folder_path=str(index_path.parent),
            index_name=index_path.stem,
        )

        logger.info("Added %d document chunks to vector store", len(documents))
        return len(documents)


# Module-level singleton
vector_store_manager = VectorStoreManager()
