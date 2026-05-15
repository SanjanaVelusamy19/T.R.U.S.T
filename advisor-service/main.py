"""
TRUST AI Financial Advisor — adaptive rule-based intelligence microservice.
"""

import logging
import sys

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from advisor_engine import (
    build_financial_health,
    build_recommendations_response,
    build_risk_analysis,
    build_summary_response,
)
from config import get_settings
from models import (
    AdvisorSummaryResponse,
    FinancialHealthResponse,
    RecommendationsResponse,
    RiskAnalysisResponse,
)
from trust_client import load_financial_signals

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("trust.advisor")

settings = get_settings()

app = FastAPI(
    title="TRUST AI Financial Advisor",
    version="1.0.0",
    description="Rule-based adaptive financial guidance for the TRUST ecosystem.",
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
            "message": "Advisor service encountered an unexpected error",
        },
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "advisor-service"}


@app.get("/advisor/summary", response_model=AdvisorSummaryResponse)
async def advisor_summary() -> AdvisorSummaryResponse:
    """Full adaptive advisory snapshot for dashboard intelligence panel."""
    signals = await load_financial_signals()
    return build_summary_response(signals)


@app.get("/advisor/recommendations", response_model=RecommendationsResponse)
async def advisor_recommendations() -> RecommendationsResponse:
    """Categorized financial recommendations feed."""
    signals = await load_financial_signals()
    return build_recommendations_response(signals)


@app.get("/advisor/risk-analysis", response_model=RiskAnalysisResponse)
async def advisor_risk_analysis() -> RiskAnalysisResponse:
    """Risk warnings, factors, and mitigation guidance."""
    signals = await load_financial_signals()
    return build_risk_analysis(signals)


@app.get("/advisor/financial-health", response_model=FinancialHealthResponse)
async def advisor_financial_health() -> FinancialHealthResponse:
    """Composite financial health score and dimension breakdown."""
    signals = await load_financial_signals()
    return build_financial_health(signals)
