"""
TRUST Score Service — adaptive financial trust index engine.
"""

import logging
import sys

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from analytics import build_timeline, default_dashboard_payload
from calculator import calculate_trust_score
from models import TrustScoreRequest, TrustScoreResponse, TimelinePoint

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("trust.score")

app = FastAPI(
    title="TRUST Score Service",
    version="1.0.0",
    description="Dynamic financial trust index and risk analytics for TRUST platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "validation_error",
            "detail": exc.errors(),
            "message": "Request validation failed",
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error path=%s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "internal_server_error",
            "message": "Trust score service encountered an unexpected error",
        },
    )


@app.post("/calculate", response_model=TrustScoreResponse)
def compute_trust_score(payload: TrustScoreRequest) -> TrustScoreResponse:
    """
    Calculate TRUST index from financial and behavioral inputs.

    Public access is brokered through the API gateway with JWT verification.
    """
    result = calculate_trust_score(payload)
    logger.info(
        "trust.calculate score=%s risk=%s salary=%s credit=%s",
        result.trust_score,
        result.risk_level,
        payload.salary,
        payload.credit_score,
    )
    return result


@app.get("/analytics/timeline", response_model=list[TimelinePoint])
def analytics_timeline() -> list[TimelinePoint]:
    """Historical trust progression for dashboard timeline charts."""
    return build_timeline(78, months=6)


@app.get("/analytics/dashboard")
def analytics_dashboard() -> dict:
    """Full visualization-ready dashboard snapshot for the intelligence console."""
    return default_dashboard_payload()


@app.get("/score")
def get_score() -> dict:
    """Mock trust score endpoint."""
    return {
        "trust_score": 84,
        "risk_level": "LOW",
        "financial_reliability": "HIGH"
    }


@app.get("/history")
def get_history() -> list[dict]:
    """Mock trust history endpoint."""
    return [
        {"month": "Jan", "score": 72},
        {"month": "Feb", "score": 75},
        {"month": "Mar", "score": 80},
        {"month": "Apr", "score": 84}
    ]


@app.get("/analytics")
def get_analytics() -> dict:
    """Alias for dashboard analytics."""
    return default_dashboard_payload()


@app.get("/recommendations")
def get_recommendations() -> list[str]:
    """Mock recommendations endpoint."""
    return [
        "Maintain consistent savings habits",
        "Excellent repayment behavior detected"
    ]


@app.get("/radar")
def get_radar() -> dict:
    """Mock radar data endpoint."""
    return {
        "salary_stability": 85,
        "credit_health": 88,
        "repayment_history": 90,
        "savings_consistency": 76,
        "transaction_stability": 80
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "trust-score-service"}