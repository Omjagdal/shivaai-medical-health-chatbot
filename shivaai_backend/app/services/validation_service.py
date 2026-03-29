"""
Validation service for grounding answers in retrieved context.
Implements hallucination detection via LLM-based fact-checking.
"""

import logging
import re

from app.core.llm import get_llm
from app.core.prompts import GROUNDEDNESS_CHECK_PROMPT

logger = logging.getLogger(__name__)


def check_groundedness(answer: str, context: str) -> float:
    """
    Evaluate how well the answer is grounded in the retrieved context.

    Returns a float score between 0.0 (not grounded) and 1.0 (fully grounded).
    Falls back to 0.5 on any error (neutral/uncertain).
    """
    if not answer.strip() or not context.strip():
        return 0.5

    try:
        llm = get_llm()
        chain = GROUNDEDNESS_CHECK_PROMPT | llm
        response = chain.invoke({"answer": answer, "context": context})
        raw = response.content.strip()

        # Parse "SCORE: <float>" from the response
        score_match = re.search(r"SCORE:\s*([\d.]+)", raw, re.IGNORECASE)
        if score_match:
            score = float(score_match.group(1))
            score = max(0.0, min(1.0, score))  # Clamp to [0, 1]
            logger.info("Groundedness score: %.2f", score)
            return score

        logger.warning("Could not parse groundedness score from: %s", raw[:100])
        return 0.5

    except Exception as e:
        logger.error("Groundedness check failed: %s", e)
        return 0.5  # Neutral fallback
