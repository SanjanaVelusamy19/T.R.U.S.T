"""Pydantic schemas for behavioral fraud detection responses."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class BehavioralStatus(str, Enum):
    NORMAL = "NORMAL"
    ELEVATED_MONITORING = "ELEVATED_MONITORING"
    SUSPICIOUS_ACTIVITY_DETECTED = "SUSPICIOUS_ACTIVITY_DETECTED"
    HIGH_RISK_BEHAVIOR = "HIGH_RISK_BEHAVIOR"


class PatternInsight(BaseModel):
    """Single request-pattern or behavioral dimension."""

    dimension: str
    score: float = Field(..., ge=0, le=100)
    status: str
    detail: str


class TrustConsistencyEvaluation(BaseModel):
    """Trust-score alignment and drift assessment."""

    trust_score: int
    consistency_score: float = Field(..., ge=0, le=100)
    drift_detected: bool
    summary: str


class FraudAnalysisResponse(BaseModel):
    """Full behavioral fraud intelligence snapshot."""

    success: bool = True
    fraud_risk_score: int = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    behavioral_status: BehavioralStatus
    alerts: list[str]
    recommendations: list[str]
    adaptive_warnings: list[str]
    request_patterns: list[PatternInsight]
    trust_consistency: TrustConsistencyEvaluation
    risk_timeline: list[dict[str, int | str]]


class FraudAlertsResponse(BaseModel):
    success: bool = True
    alerts: list[str]
    adaptive_warnings: list[str]
    behavioral_status: BehavioralStatus


class FraudRiskScoreResponse(BaseModel):
    success: bool = True
    fraud_risk_score: int = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    behavioral_status: BehavioralStatus


class BehaviorCheckResponse(BaseModel):
    success: bool = True
    behavioral_status: BehavioralStatus
    request_patterns: list[PatternInsight]
    trust_consistency: TrustConsistencyEvaluation
    flags: list[str]
