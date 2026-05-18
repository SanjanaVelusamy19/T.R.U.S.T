"""Pydantic schemas for financial digital twin simulations."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class HealthForecast(str, Enum):
    IMPROVING = "IMPROVING"
    STABLE = "STABLE"
    DECLINING = "DECLINING"


class RiskProjection(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ScenarioId(str, Enum):
    INCREASED_SAVINGS = "increased_savings"
    REDUCED_SPENDING = "reduced_spending"
    ADDITIONAL_LOAN = "additional_loan"
    STABLE_REPAYMENT = "stable_repayment"
    RISKY_BEHAVIOR = "risky_behavior"
    IMPROVED_INCOME = "improved_income"


class TimelinePoint(BaseModel):
    month: str
    trust_score: int
    savings_index: float
    spending_index: float
    risk_index: float
    health_index: float


class SavingsPoint(BaseModel):
    month: str
    savings_index: float
    growth_rate_pct: float


class RiskPoint(BaseModel):
    month: str
    risk_index: float
    risk_level: RiskProjection


class FinancialScenario(BaseModel):
    id: ScenarioId
    title: str
    description: str
    projected_trust_score: int
    risk_projection: RiskProjection
    health_forecast: HealthForecast
    impact_summary: str


class TwinForecastResponse(BaseModel):
    success: bool = True
    current_trust_score: int
    projected_trust_score: int
    projection_period_months: int
    financial_health_forecast: HealthForecast
    risk_projection: RiskProjection
    simulation_summary: str
    recommendations: list[str]
    trust_timeline: list[TimelinePoint]
    savings_forecast: list[SavingsPoint]
    risk_timeline: list[RiskPoint]
    active_scenario: str = "baseline"


class TrustProjectionResponse(BaseModel):
    success: bool = True
    current_trust_score: int
    projected_trust_score: int
    projection_period_months: int
    trust_timeline: list[TimelinePoint]
    momentum_delta: float


class RiskSimulationResponse(BaseModel):
    success: bool = True
    current_risk: RiskProjection
    projected_risk: RiskProjection
    risk_timeline: list[RiskPoint]
    loan_risk_impact: str


class SavingsGrowthResponse(BaseModel):
    success: bool = True
    current_savings_index: float
    projected_savings_index: float
    monthly_growth_rate_pct: float
    savings_forecast: list[SavingsPoint]


class ScenariosResponse(BaseModel):
    success: bool = True
    scenarios: list[FinancialScenario]
    recommended_scenario: ScenarioId
