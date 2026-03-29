"""
Documents router — /api/v1/upload-docs
Handles document upload, text extraction, and FAISS ingestion.
Also provides backward-compatible report analysis endpoint.
"""

import logging
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.models.schemas import UploadDocsResponse, ReportAnalysisResponse
from app.core.vector_store import vector_store_manager
from app.core.llm import get_llm
from app.core.prompts import REPORT_ANALYSIS_PROMPT, TERM_SIMPLIFIER_PROMPT
from app.config import UPLOAD_DIR, TEMP_UPLOAD_DIR

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/docs", tags=["documents"])


def _extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using pdfplumber with OCR fallback."""
    import pdfplumber
    import io

    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                else:
                    # OCR fallback for image-based pages
                    try:
                        import pytesseract
                        from PIL import Image

                        img = page.to_image(resolution=300)
                        img_byte_arr = io.BytesIO()
                        img.original.save(img_byte_arr, format="PNG")
                        img_byte_arr.seek(0)
                        ocr_text = pytesseract.image_to_string(
                            Image.open(img_byte_arr)
                        )
                        text += ocr_text + "\n"
                    except ImportError:
                        logger.warning("pytesseract not available for OCR")
    except Exception as e:
        logger.error("PDF extraction error: %s", e)
        raise HTTPException(
            status_code=422,
            detail=f"Could not extract text from PDF: {str(e)}",
        )
    return text


def _extract_text_from_txt(file_path: str) -> str:
    """Extract text from a plain text file."""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


@router.post("/upload", response_model=UploadDocsResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document (PDF or TXT) to be ingested into the vector store.
    Text is extracted, chunked, and added to FAISS for RAG retrieval.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in (".pdf", ".txt", ".md"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Supported: .pdf, .txt, .md",
        )

    # Save to temp directory
    temp_path = str(Path(TEMP_UPLOAD_DIR) / file.filename)
    try:
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        # Extract text
        if suffix == ".pdf":
            text = _extract_text_from_pdf(temp_path)
        else:
            text = _extract_text_from_txt(temp_path)

        if not text.strip():
            raise HTTPException(
                status_code=422, detail="No text could be extracted from the file"
            )

        # Add to vector store
        if not vector_store_manager.is_loaded:
            raise HTTPException(
                status_code=503,
                detail="Vector store not initialized. Please try again later.",
            )

        chunks_added = vector_store_manager.add_documents(
            texts=[text],
            metadatas=[{"source": file.filename, "disease": "Uploaded Document"}],
        )

        logger.info(
            "Document uploaded: %s (%d chunks)", file.filename, chunks_added
        )

        return UploadDocsResponse(
            filename=file.filename,
            chunks_added=chunks_added,
            message=f"Successfully ingested {chunks_added} chunks into the knowledge base.",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Upload error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp file
        try:
            Path(temp_path).unlink(missing_ok=True)
        except Exception:
            pass


@router.post("/upload-report", response_model=ReportAnalysisResponse)
async def upload_report(file: UploadFile = File(...)):
    """
    Upload a medical report for AI analysis.
    Backward-compatible with the original /upload-report/ endpoint.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Save to upload directory
    file_location = str(Path(UPLOAD_DIR) / file.filename)
    content = await file.read()
    with open(file_location, "wb") as f:
        f.write(content)

    # Extract text
    suffix = Path(file.filename).suffix.lower()
    if suffix == ".pdf":
        text = _extract_text_from_pdf(file_location)
    else:
        text = content.decode("utf-8", errors="ignore")

    if not text.strip():
        raise HTTPException(
            status_code=422, detail="No text could be extracted from the report"
        )

    # Analyze with LLM
    try:
        llm = get_llm()
        chain = REPORT_ANALYSIS_PROMPT | llm
        response = chain.invoke({"report_text": text[:3000]})
        analysis = response.content
    except Exception as e:
        logger.error("Report analysis error: %s", e)
        analysis = f"Error analyzing report: {str(e)}"

    return ReportAnalysisResponse(
        filename=file.filename,
        analysis=analysis,
    )


@router.post("/simplify-term")
async def simplify_term(term: str = Form(...)):
    """Simplify a medical term into plain language."""
    try:
        llm = get_llm()
        chain = TERM_SIMPLIFIER_PROMPT | llm
        response = chain.invoke({"term": term})
        return {"term": term, "simplified": response.content}
    except Exception as e:
        logger.error("Term simplification error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
