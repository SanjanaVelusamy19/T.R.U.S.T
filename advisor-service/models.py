"""Pydantic contracts for the TRUST AI Financial Advisor."""

from pydantic import BaseModel, Field


class AdvisorInsight(BaseModel):
    category: str
    title: str
    detail: str
    priority: str = "medium"


class AdvisorSummaryResponse(BaseModel):
    success: bool = True
    advisor_summary: str
    recommendations: list[str]
    risk_warnings: list[str]
    financial_health_score: int = Field(..., ge=0, le=100)
    trust_score: int = Field(..., ge=0, le=100)
    risk_level: str
    financial_reliability: str
    insights: list[AdvisorInsight] = Field(default_factory=list)


class RecommendationsResponse(BaseModel):
    success: bool = True
    recommendations: list[str]


class RiskAnalysisResponse(BaseModel):
    success: bool = True
    risk_level: str
    risk_warnings: list[str]
    risk_factors: list[str]
    mitigation_steps: list[str]


class FinancialHealthResponse(BaseModel):
    success: bool = True
    financial_health_score: int = Field(..., ge=0, le=100)
    advisor_summary: str
    dimensions: dict[str, float]
