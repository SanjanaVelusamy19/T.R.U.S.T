"""
TRUST Behavioral Fraud Detection — adaptive rule-based security intelligence.
"""

import logging
import sys

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from fraud_engine import (
    build_alerts_response,
    build_analysis_response,
    build_behavior_check_response,
    build_risk_score_response,
)
from models import (
    BehaviorCheckResponse,
    FraudAlertsResponse,
    FraudAnalysisResponse,
    FraudRiskScoreResponse,
)
from trust_client import load_behavioral_signals

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("trust.fraud")

app = FastAPI(
    title="TRUST Fraud Detection Service",
    version="1.0.0",
    description="Behavioral fraud detection and adaptive risk intelligence for TRUST.",
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
            "message": "Fraud detection service encountered an unexpected error",
        },
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "fraud-detection-service"}


@app.get("/fraud/analysis", response_model=FraudAnalysisResponse)
async def fraud_analysis() -> FraudAnalysisResponse:
    """Full behavioral fraud intelligence snapshot."""
    signals = await load_behavioral_signals()
    result = build_analysis_response(signals)
    logger.info(
        "fraud.analysis score=%s level=%s status=%s",
        result.fraud_risk_score,
        result.risk_level,
        result.behavioral_status,
    )
    return result


@app.get("/fraud/alerts", response_model=FraudAlertsResponse)
async def fraud_alerts() -> FraudAlertsResponse:
    """Suspicious activity alerts and adaptive warnings."""
    signals = await load_behavioral_signals()
    return build_alerts_response(signals)


@app.get("/fraud/risk-score", response_model=FraudRiskScoreResponse)
async def fraud_risk_score() -> FraudRiskScoreResponse:
    """Fraud risk score and classification band."""
    signals = await load_behavioral_signals()
    return build_risk_score_response(signals)


@app.get("/fraud/behavior-check", response_model=BehaviorCheckResponse)
async def fraud_behavior_check() -> BehaviorCheckResponse:
    """Request pattern analysis and trust consistency evaluation."""
    signals = await load_behavioral_signals()
    return build_behavior_check_response(signals)
