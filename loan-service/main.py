"""
TRUST Loan Service — eligibility simulation and pricing hints.
"""

import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from eligibility import evaluate_loan
from models import LoanCheckRequest, LoanCheckResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("trust.loan")

app = FastAPI(
    title="TRUST Loan Service",
    version="1.0.0",
    description="Loan eligibility engine for TRUST retail lending simulation.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/check-loan", response_model=LoanCheckResponse)
def check_loan(payload: LoanCheckRequest) -> LoanCheckResponse:
    """
    Evaluate applicant attributes and return eligibility, limits, and EMI estimate.

    In production, this endpoint would sit behind strict network controls;
    the public gateway enforces JWT authentication before forwarding traffic.
    """
    result = evaluate_loan(payload)
    logger.info(
        "loan.check eligible=%s salary=%s score=%s",
        result.eligible,
        payload.salary,
        payload.credit_score,
    )
    return result


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "loan-service"}
