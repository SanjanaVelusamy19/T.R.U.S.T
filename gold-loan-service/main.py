"""
TRUST Gold Loan Service — collateral-backed lending intelligence.
"""

import logging
import sys

from fastapi import FastAPI, Query, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from gold_engine import (
    build_interest_rates,
    build_recommendations,
    build_risk_analysis,
    evaluate_gold_loan,
)
from models import (
    GoldEvaluateRequest,
    GoldEvaluateResponse,
    GoldPurity,
    InterestRatesResponse,
    RecommendationsResponse,
    RiskAnalysisResponse,
)
from trust_client import load_trust_baseline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("trust.gold_loan")

app = FastAPI(
    title="TRUST Gold Loan Service",
    version="1.0.0",
    description="Gold valuation, eligibility, and trust-aware collateral lending for TRUST.",
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
            "message": "Gold loan service encountered an unexpected error",
        },
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "gold-loan-service"}


@app.post("/gold-loan/evaluate", response_model=GoldEvaluateResponse)
async def gold_loan_evaluate(payload: GoldEvaluateRequest) -> GoldEvaluateResponse:
    baseline = await load_trust_baseline()
    result = evaluate_gold_loan(payload, baseline)
    logger.info(
        "gold.evaluate weight=%s purity=%s eligible=%s limit=%s risk=%s",
        result.gold_weight_grams,
        result.purity,
        result.eligible,
        result.trust_adjusted_limit,
        result.risk_level,
    )
    return result


@app.get("/gold-loan/risk-analysis", response_model=RiskAnalysisResponse)
async def gold_loan_risk_analysis(
    gold_weight_grams: float = Query(default=50.0, gt=0, le=5000),
    purity: GoldPurity = Query(default=GoldPurity.K22),
) -> RiskAnalysisResponse:
    baseline = await load_trust_baseline()
    return build_risk_analysis(baseline, gold_weight_grams, purity)


@app.get("/gold-loan/interest-rates", response_model=InterestRatesResponse)
async def gold_loan_interest_rates() -> InterestRatesResponse:
    baseline = await load_trust_baseline()
    return build_interest_rates(baseline)


@app.get("/gold-loan/recommendations", response_model=RecommendationsResponse)
async def gold_loan_recommendations(
    gold_weight_grams: float = Query(default=50.0, gt=0, le=5000),
    purity: GoldPurity = Query(default=GoldPurity.K22),
) -> RecommendationsResponse:
    baseline = await load_trust_baseline()
    return build_recommendations(baseline, gold_weight_grams, purity)
