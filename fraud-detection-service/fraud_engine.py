"""
Rule-based behavioral fraud reasoning engine.

Deterministic heuristics over trust analytics, request frequency, login timing,
loan velocity, and authentication failure patterns — no external AI APIs.
"""

from __future__ import annotations

from dataclasses import dataclass

from models import (
    BehavioralStatus,
    BehaviorCheckResponse,
    FraudAlertsResponse,
    FraudAnalysisResponse,
    FraudRiskScoreResponse,
    PatternInsight,
    RiskLevel,
    TrustConsistencyEvaluation,
)
from signals import BehavioralSignals


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _timeline_variance(scores: tuple[int, ...]) -> float:
    if len(scores) < 2:
        return 0.0
    mean = sum(scores) / len(scores)
    return sum((s - mean) ** 2 for s in scores) / len(scores)


@dataclass(frozen=True)
class FraudAssessment:
    fraud_risk_score: int
    risk_level: RiskLevel
    behavioral_status: BehavioralStatus
    alerts: list[str]
    recommendations: list[str]
    adaptive_warnings: list[str]
    request_patterns: list[PatternInsight]
    trust_consistency: TrustConsistencyEvaluation
    risk_timeline: list[dict[str, int | str]]
    flags: list[str]


def _classify_risk(score: int) -> RiskLevel:
    if score >= 85:
        return RiskLevel.CRITICAL
    if score >= 65:
        return RiskLevel.HIGH
    if score >= 40:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def _classify_behavioral(score: int) -> BehavioralStatus:
    if score >= 80:
        return BehavioralStatus.HIGH_RISK_BEHAVIOR
    if score >= 55:
        return BehavioralStatus.SUSPICIOUS_ACTIVITY_DETECTED
    if score >= 35:
        return BehavioralStatus.ELEVATED_MONITORING
    return BehavioralStatus.NORMAL


def assess_fraud(signals: BehavioralSignals) -> FraudAssessment:
    """Run full behavioral fraud analysis pipeline."""
    alerts: list[str] = []
    recommendations: list[str] = []
    adaptive_warnings: list[str] = []
    flags: list[str] = []
    pattern_scores: list[tuple[str, float, str, str]] = []

    # Request frequency heuristics
    freq_risk = _clamp((signals.derived_request_rate - 6) * 4.5)
    if signals.derived_request_rate >= 18:
        alerts.append("Suspicious request frequency spike detected in current session.")
        flags.append("request_frequency_spike")
    pattern_scores.append(
        (
            "Request Frequency",
            freq_risk,
            "ELEVATED" if freq_risk >= 50 else "NORMAL",
            f"{signals.derived_request_rate:.1f} requests/min vs baseline ~8",
        )
    )

    # Financial behavior anomaly
    fin_deviation = _clamp(100 - (signals.behavioral_stability * 0.55 + signals.transaction_stability * 0.45))
    if fin_deviation >= 45:
        alerts.append("Behavior deviates from normal financial activity.")
        recommendations.append("Review recent transaction clusters for outlier merchants.")
    pattern_scores.append(
        (
            "Financial Behavior",
            fin_deviation,
            "ANOMALY" if fin_deviation >= 50 else "STABLE",
            "Spending and repayment rhythm compared to trust baseline",
        )
    )

    # Rapid loan attempts
    loan_risk = _clamp(signals.derived_loan_attempts * 22)
    if signals.derived_loan_attempts >= 3:
        alerts.append("Multiple rapid loan requests detected.")
        recommendations.append("Temporarily limit high-risk loan requests.")
        flags.append("rapid_loan_attempts")
    pattern_scores.append(
        (
            "Loan Velocity",
            loan_risk,
            "HIGH" if loan_risk >= 55 else "NORMAL",
            f"{signals.derived_loan_attempts} loan inquiries in rolling window",
        )
    )

    # Unusual login timing (0–5 local hour)
    login_risk = 0.0
    if signals.login_hour <= 5:
        login_risk = 58.0
        alerts.append("Unusual login timing detected outside typical activity hours.")
        adaptive_warnings.append("Adaptive watch: off-hours session flagged for review.")
    elif signals.login_hour >= 23:
        login_risk = 32.0
    pattern_scores.append(
        (
            "Login Timing",
            login_risk,
            "UNUSUAL" if login_risk >= 40 else "NORMAL",
            f"Session initiated at hour {signals.login_hour:02d}:00 local",
        )
    )

    # Trust-score consistency
    variance = _timeline_variance(signals.timeline_scores)
    consistency = _clamp(100 - variance * 1.8 - abs(signals.trust_momentum - signals.trust_score) * 0.35)
    drift = variance > 36 or abs(signals.trust_momentum - signals.trust_score) > 14
    if drift:
        alerts.append("Trust-score trajectory shows inconsistency with behavioral signals.")
        flags.append("trust_drift")
    trust_eval = TrustConsistencyEvaluation(
        trust_score=signals.trust_score,
        consistency_score=round(consistency, 1),
        drift_detected=drift,
        summary=(
            "Behavioral dimensions align with published trust index."
            if consistency >= 72 and not drift
            else "Detected divergence between momentum, timeline, and live trust score."
        ),
    )
    consistency_risk = _clamp(100 - consistency)
    pattern_scores.append(
        (
            "Trust Consistency",
            consistency_risk,
            "DRIFT" if drift else "ALIGNED",
            trust_eval.summary,
        )
    )

    # Transaction / risky patterns
    txn_risk = _clamp(100 - signals.transaction_stability)
    if txn_risk >= 42:
        alerts.append("Risky transaction pattern volatility exceeds adaptive threshold.")
    pattern_scores.append(
        (
            "Transaction Patterns",
            txn_risk,
            "VOLATILE" if txn_risk >= 45 else "STABLE",
            "Rolling stability index from trust graph",
        )
    )

    # Failed authentication
    auth_risk = _clamp(signals.derived_failed_auth * 18)
    if signals.derived_failed_auth >= 3:
        alerts.append("Repeated failed authentication attempts observed.")
        recommendations.append("Enable additional identity verification.")
        flags.append("auth_failures")
    pattern_scores.append(
        (
            "Authentication Failures",
            auth_risk,
            "CRITICAL" if auth_risk >= 50 else "NORMAL",
            f"{signals.derived_failed_auth} failed attempts in monitoring window",
        )
    )

    # Composite adaptive score (weighted)
    raw = (
        freq_risk * 0.16
        + fin_deviation * 0.18
        + loan_risk * 0.17
        + login_risk * 0.1
        + consistency_risk * 0.17
        + txn_risk * 0.12
        + auth_risk * 0.1
    )
    if signals.risk_level == "HIGH":
        raw += 8
    elif signals.risk_level == "LOW" and signals.trust_score >= 80:
        raw -= 6

    fraud_score = int(round(_clamp(raw)))
    risk_level = _classify_risk(fraud_score)
    behavioral_status = _classify_behavioral(fraud_score)

    if fraud_score >= 55 and "Enable additional identity verification." not in recommendations:
        recommendations.append("Enable additional identity verification.")
    if fraud_score >= 45 and "Temporarily limit high-risk loan requests." not in recommendations:
        recommendations.append("Temporarily limit high-risk loan requests.")
    if fraud_score >= 65:
        adaptive_warnings.append("Adaptive risk engine elevated session to enhanced monitoring.")
    if fraud_score >= 40 and not adaptive_warnings:
        adaptive_warnings.append("Continuous behavioral fingerprinting active — no immediate action required.")

    if not alerts and fraud_score >= 35:
        alerts.append("Minor behavioral deviations detected — monitoring continues.")

    request_patterns = [
        PatternInsight(dimension=d, score=round(s, 1), status=st, detail=dt)
        for d, s, st, dt in pattern_scores
    ]

    months = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
    risk_timeline: list[dict[str, int | str]] = []
    for idx, trust_pt in enumerate(signals.timeline_scores):
        drift_factor = abs(trust_pt - signals.trust_score) * 0.9
        point_risk = int(round(_clamp(22 + (100 - trust_pt) * 0.35 + drift_factor)))
        risk_timeline.append(
            {
                "month": months[idx % 12],
                "trust_score": trust_pt,
                "fraud_risk": point_risk,
            }
        )

    return FraudAssessment(
        fraud_risk_score=fraud_score,
        risk_level=risk_level,
        behavioral_status=behavioral_status,
        alerts=alerts,
        recommendations=recommendations,
        adaptive_warnings=adaptive_warnings,
        request_patterns=request_patterns,
        trust_consistency=trust_eval,
        risk_timeline=risk_timeline,
        flags=flags,
    )


def build_analysis_response(signals: BehavioralSignals) -> FraudAnalysisResponse:
    result = assess_fraud(signals)
    return FraudAnalysisResponse(
        fraud_risk_score=result.fraud_risk_score,
        risk_level=result.risk_level,
        behavioral_status=result.behavioral_status,
        alerts=result.alerts,
        recommendations=result.recommendations,
        adaptive_warnings=result.adaptive_warnings,
        request_patterns=result.request_patterns,
        trust_consistency=result.trust_consistency,
        risk_timeline=result.risk_timeline,
    )


def build_alerts_response(signals: BehavioralSignals) -> FraudAlertsResponse:
    result = assess_fraud(signals)
    return FraudAlertsResponse(
        alerts=result.alerts,
        adaptive_warnings=result.adaptive_warnings,
        behavioral_status=result.behavioral_status,
    )


def build_risk_score_response(signals: BehavioralSignals) -> FraudRiskScoreResponse:
    result = assess_fraud(signals)
    return FraudRiskScoreResponse(
        fraud_risk_score=result.fraud_risk_score,
        risk_level=result.risk_level,
        behavioral_status=result.behavioral_status,
    )


def build_behavior_check_response(signals: BehavioralSignals) -> BehaviorCheckResponse:
    result = assess_fraud(signals)
    return BehaviorCheckResponse(
        behavioral_status=result.behavioral_status,
        request_patterns=result.request_patterns,
        trust_consistency=result.trust_consistency,
        flags=result.flags,
    )
