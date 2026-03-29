# ─── Backend Dockerfile ───
# Multi-stage build for SHIVAAI FastAPI backend

FROM python:3.11-slim AS base

# Set workdir
WORKDIR /app

# Install system dependencies for PDF/OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploaded_reports temp_uploads scripts

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/api/v1/health')" || exit 1

# Run with uvicorn (reads PORT env var for Render compat)
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001} --workers 1"
