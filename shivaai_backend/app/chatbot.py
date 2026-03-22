import json
import io
import re
import numpy as np
import pdfplumber
import pytesseract
from PIL import Image

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

from .config import GEMINI_API_KEY, FAISS_INDEX_PATH, METADATA_PATH


# -------------------------
# LLM SETUP (Gemini)
# -------------------------
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=GEMINI_API_KEY,
    temperature=0.3
)

# -------------------------
# EMBEDDING MODEL
# -------------------------
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# -------------------------
# LOAD FAISS + METADATA
# -------------------------
vectorstore = None
metadata = None

try:
    import faiss
    from pathlib import Path as _Path
    from langchain_community.docstore.in_memory import InMemoryDocstore

    if _Path(FAISS_INDEX_PATH).exists():
        raw_index = faiss.read_index(str(FAISS_INDEX_PATH))
        
        vectorstore = FAISS.load_local(
            folder_path=str(_Path(FAISS_INDEX_PATH).parent),
            embeddings=embeddings,
            index_name=_Path(FAISS_INDEX_PATH).stem,
            allow_dangerous_deserialization=True
        )
        print(f"✅ FAISS index loaded from {FAISS_INDEX_PATH}")
    else:
        print(f"⚠️ FAISS index not found at {FAISS_INDEX_PATH}")
except Exception as e:
    print(f"⚠️ Failed to load FAISS index: {e}")

try:
    from pathlib import Path as _Path
    if _Path(METADATA_PATH).exists():
        with open(METADATA_PATH, "r") as f:
            metadata = json.load(f)
        print(f"✅ Metadata loaded from {METADATA_PATH}")
    else:
        print(f"⚠️ Metadata not found at {METADATA_PATH}")
except Exception as e:
    print(f"⚠️ Failed to load metadata: {e}")


# -------------------------
# CONTEXT RETRIEVAL
# -------------------------
def get_relevant_contexts(query, k=3):
    if vectorstore is None:
        return []
    docs = vectorstore.similarity_search(query, k=k)
    return [doc.page_content for doc in docs]


# -------------------------
# DISEASE INFO USING RAG
# -------------------------
disease_prompt = PromptTemplate(
    input_variables=["question", "context"],
    template="""
    Question: {question}

    Relevant Information:
    {context}

    Answer based only on the provided information.
"""
)


def get_disease_info(question):
    try:
        contexts = get_relevant_contexts(question)

        chain = disease_prompt | llm

        response = chain.invoke({
            "question": question,
            "context": contexts
        })

        return response.content

    except Exception as e:
        return f"Error: {str(e)}"


# -------------------------
# SIMPLIFY MEDICAL TERM
# -------------------------
simplify_prompt = PromptTemplate(
    input_variables=["term"],
    template="Simplify the medical term '{term}' in simple language."
)


def simplify_terms(term):
    try:
        chain = simplify_prompt | llm
        response = chain.invoke({"term": term})
        return response.content

    except Exception as e:
        return f"Error: {str(e)}"


# -------------------------
# RESPONSE CLEANING
# -------------------------
def clean_response(response_text):

    acronyms = {
        r'\bCbc\b': 'CBC',
        r'\bWbc\b': 'WBC',
        r'\bHct\b': 'HCT',
        r'\bMcv\b': 'MCV',
        r'\bMch\b': 'MCH',
        r'\bMchc\b': 'MCHC',
        r'\bRbc\b': 'RBC'
    }

    for pattern, replacement in acronyms.items():
        response_text = re.sub(pattern, replacement, response_text, flags=re.IGNORECASE)

    response_text = re.sub(
        r'\b([A-Za-z]+)\b(?=:\s+\d|\(Missing\))',
        lambda m: m.group(1).title(),
        response_text
    )

    response_text = re.sub(r'(\n#+\s)', r'\n\n\1', response_text)
    response_text = re.sub(r'(\n\*\*.*\*\*)', r'\n\n\1', response_text)
    response_text = re.sub(r'-\s*([^\s])', r'- \1', response_text)
    response_text = re.sub(r'\n{3,}', r'\n\n', response_text)

    return response_text.strip()


# -------------------------
# PDF REPORT ANALYSIS
# -------------------------
analysis_prompt = PromptTemplate(
    input_variables=["report_text"],
    template="""
Analyze this medical report and output in this exact structured Markdown format.

### Medical Report Analysis: Complete Blood Count (CBC)

**Report Overview**  
[Brief summary]

#### **Patient Information**
- **Name**:  
- **Age**:  
- **Sex**:  
- **Date of Report**:  

#### **Test Results**
- **Hemoglobin**:  
- **Total Leukocyte Count (WBC)**:  
- **Differential Leukocyte Count**:  
- **Platelet Count**:  
- **Total RBC Count**:  
- **Hematocrit (HCT)**:  
- **Mean Corpuscular Volume (MCV)**:  
- **Mean Cell Hemoglobin (MCH)**:  
- **Mean Cell Hemoglobin Concentration (MCHC)**:  

#### **Clinical Notes from Report**

#### **Potential Diseases/Conditions**

#### **Treatments Suggested**

#### **Precautions and Recommendations**

Report text:
{report_text}
"""
)


def extract_pdf_text(file_location):

    text = ""

    with pdfplumber.open(file_location) as pdf:

        for page in pdf.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

            else:
                img = page.to_image(resolution=300)
                img_byte_arr = io.BytesIO()

                img.original.save(img_byte_arr, format='PNG')
                img_byte_arr.seek(0)

                ocr_text = pytesseract.image_to_string(
                    Image.open(img_byte_arr)
                )

                text += ocr_text + "\n"

    return text


def analyze_report(file_location):

    try:
        text = extract_pdf_text(file_location)

        if not text.strip():
            return "Error: No text extracted."

        chain = analysis_prompt | llm

        response = chain.invoke({
            "report_text": text[:2000]
        })

        return clean_response(response.content)

    except Exception as e:
        return f"Error analyzing report: {str(e)}"
