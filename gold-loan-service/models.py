"""Pydantic schemas for gold-backed lending intelligence."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class GoldPurity(str, Enum):
    K24 = "24K"
    K22 = "22K"
    K18 = "18K"
    K14 = "14K"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class GoldEvaluateRequest(BaseModel):
    gold_weight_grams: float = Field(..., gt=0, le=5000)
    purity: GoldPurity = GoldPurity.K22
    monthly_income: float | None = Field(default=None, ge=0)
    requested_loan_amount: float | None = Field(default=None, ge=0)
    tenure_months: int = Field(default=12, ge=3, le=36)


class GoldEvaluateResponse(BaseModel):
    success: bool = True
    gold_weight_grams: float
    purity: str
    estimated_gold_value: float
    eligible_loan_amount: float
    trust_adjusted_limit: float
    risk_level: RiskLevel
    interest_rate: str
    trust_score: int
    repayment_safety_score: float
    collateral_risk_score: float
    eligible: bool
    recommendations: list[str]


class CollateralBreakdown(BaseModel):
    label: str
    value: float


class RiskFactor(BaseModel):
    name: str
    score: float
    status: RiskLevel
    detail: str


class RiskAnalysisResponse(BaseModel):
    success: bool = True
    risk_level: RiskLevel
    collateral_risk_score: float
    trust_score: int
    trust_impact: str
    factors: list[RiskFactor]
    summary: str


class InterestRateTier(BaseModel):
    tier: str
    annual_rate: str
    trust_range: str
    description: str


class InterestRatesResponse(BaseModel):
    success: bool = True
    base_rate: str
    tiers: list[InterestRateTier]
    current_applicable_rate: str
    trust_score: int


class LendingRecommendation(BaseModel):
    title: str
    detail: str
    priority: str


class RecommendationsResponse(BaseModel):
    success: bool = True
    trust_score: int
    risk_level: RiskLevel
    recommendations: list[LendingRecommendation]
    adaptive_insights: list[str]
