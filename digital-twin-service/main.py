"""
TRUST Financial Digital Twin — adaptive future financial simulation.
"""

import logging
import sys

from fastapi import FastAPI, Query, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import (
    RiskSimulationResponse,
    SavingsGrowthResponse,
    ScenarioId,
    ScenariosResponse,
    TrustProjectionResponse,
    TwinForecastResponse,
)
from trust_client import load_twin_baseline
from twin_engine import (
    build_forecast,
    build_risk_simulation,
    build_savings_growth,
    build_scenarios,
    build_trust_projection,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("trust.twin")

app = FastAPI(
    title="TRUST Financial Digital Twin",
    version="1.0.0",
    description="Rule-based financial future simulation for the TRUST ecosystem.",
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
            "message": "Digital twin service encountered an unexpected error",
        },
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "digital-twin-service"}


@app.get("/twin/forecast", response_model=TwinForecastResponse)
async def twin_forecast(
    scenario: ScenarioId | None = Query(default=None, description="Optional simulation scenario"),
) -> TwinForecastResponse:
    baseline = await load_twin_baseline()
    result = build_forecast(baseline, scenario)
    logger.info(
        "twin.forecast current=%s projected=%s scenario=%s",
        result.current_trust_score,
        result.projected_trust_score,
        result.active_scenario,
    )
    return result


@app.get("/twin/trust-projection", response_model=TrustProjectionResponse)
async def twin_trust_projection() -> TrustProjectionResponse:
    baseline = await load_twin_baseline()
    return build_trust_projection(baseline)


@app.get("/twin/risk-simulation", response_model=RiskSimulationResponse)
async def twin_risk_simulation() -> RiskSimulationResponse:
    baseline = await load_twin_baseline()
    return build_risk_simulation(baseline)


@app.get("/twin/savings-growth", response_model=SavingsGrowthResponse)
async def twin_savings_growth() -> SavingsGrowthResponse:
    baseline = await load_twin_baseline()
    return build_savings_growth(baseline)


@app.get("/twin/scenarios", response_model=ScenariosResponse)
async def twin_scenarios() -> ScenariosResponse:
    baseline = await load_twin_baseline()
    return build_scenarios(baseline)
