"""
Pydantic schemas for TRUST Index calculation API contracts.
"""

from enum import Enum

from pydantic import BaseModel, Field


class EmploymentType(str, Enum):
    """Employment categories for reliability scoring."""

    SALARIED = "salaried"
    SELF_EMPLOYED = "self_employed"
    CONTRACT = "contract"
    FREELANCE = "freelance"
    UNEMPLOYED = "unemployed"


class TrustScoreRequest(BaseModel):
    """Financial attributes used to compute the adaptive TRUST index."""

    salary: float = Field(..., gt=0, description="Annual gross salary")
    credit_score: int = Field(..., ge=300, le=850)
    repayment_history: float = Field(..., ge=0, le=100, description="On-time repayment rate (%)")
    savings_consistency: float = Field(..., ge=0, le=100, description="Savings habit score (%)")
    transaction_stability: float = Field(..., ge=0, le=100, description="Transaction pattern stability (%)")
    employment_type: EmploymentType = Field(default=EmploymentType.SALARIED)


class TimelinePoint(BaseModel):
    month: str
    score: int = Field(..., ge=0, le=100)


class RadarDimension(BaseModel):
    label: str
    value: float = Field(..., ge=0, le=100)


class AnalyticsCard(BaseModel):
    label: str
    value: float = Field(..., ge=0, le=100)
    trend: str | None = None


class RiskIndicators(BaseModel):
    risk_level: str
    trust_confidence: float = Field(..., ge=0, le=100)
    financial_safety_score: float = Field(..., ge=0, le=100)


class TrustVisualization(BaseModel):
    timeline: list[TimelinePoint]
    radar: list[RadarDimension]
    analytics_cards: list[AnalyticsCard]
    risk_indicators: RiskIndicators
    insights: list[str]


class TrustScoreResponse(BaseModel):
    """Structured trust analytics returned to clients."""

    success: bool = True
    trust_score: int = Field(..., ge=0, le=100)
    risk_level: str
    financial_reliability: str
    recommendations: list[str]
    timeline: list[TimelinePoint] = Field(default_factory=list)
    radar: list[RadarDimension] = Field(default_factory=list)
    analytics_cards: list[AnalyticsCard] = Field(default_factory=list)
    risk_indicators: RiskIndicators | None = None
    insights: list[str] = Field(default_factory=list)
