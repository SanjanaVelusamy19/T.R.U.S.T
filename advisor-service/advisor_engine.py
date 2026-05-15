"""
Rule-based adaptive financial advisor — deterministic intelligence layer.

Simulates AI-style guidance from trust analytics and behavioral heuristics.
"""

from __future__ import annotations

from signals import FinancialSignals
from models import (
    AdvisorInsight,
    AdvisorSummaryResponse,
    FinancialHealthResponse,
    RecommendationsResponse,
    RiskAnalysisResponse,
)


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def compute_financial_health_score(signals: FinancialSignals) -> int:
    """Weighted composite health index."""
    raw = (
        signals.trust_score * 0.28
        + signals.repayment_strength * 0.22
        + signals.savings_discipline * 0.18
        + signals.spending_stability * 0.14
        + signals.credit_health * 0.12
        + signals.salary_stability * 0.06
    )
    return int(round(_clamp(raw)))


def _build_summary(signals: FinancialSignals, health: int) -> str:
    volatility = "low" if signals.spending_stability >= 78 else "moderate" if signals.spending_stability >= 65 else "elevated"
    parts = [
        f"Financial behavior is {'stable' if health >= 75 else 'developing'} with {volatility} spending volatility.",
        f"Trust index at {signals.trust_score} ({signals.risk_level} risk band).",
    ]
    if signals.loan_eligibility_band == "premium":
        parts.append("Profile supports premium institutional credit surfaces.")
    elif signals.loan_eligibility_band == "moderate":
        parts.append("Eligible for moderate-risk loan products with standard underwriting.")
    elif signals.loan_eligibility_band == "conservative":
        parts.append("Conservative lending products recommended until trust velocity improves.")
    else:
        parts.append("Focus on trust rehabilitation before new credit exposure.")
    return " ".join(parts)


def _savings_advice(signals: FinancialSignals) -> list[str]:
    tips: list[str] = []
    if signals.savings_discipline >= 80:
        tips.append("Maintain current repayment and savings cadence to preserve trust momentum.")
    elif signals.savings_discipline >= 65:
        tips.append("Increase recurring savings by 8–12% to strengthen discipline metrics.")
    else:
        tips.append("Establish automated monthly savings transfers to lift consistency scores.")
    if signals.savings_discipline < 75:
        tips.append("Reduce discretionary spending by 10% to improve savings stability.")
    return tips


def _emi_advice(signals: FinancialSignals) -> list[str]:
    tips: list[str] = []
    if signals.repayment_strength >= 85 and signals.loan_eligibility_band in ("premium", "moderate"):
        tips.append("Current EMI capacity is healthy — consider shorter tenor to reduce total interest.")
    elif signals.repayment_strength >= 70:
        tips.append("Target EMI-to-income below 35% when evaluating new credit lines.")
    else:
        tips.append("Prioritize existing EMI obligations before accepting additional leverage.")
    if signals.spending_stability < 70:
        tips.append("Stabilize monthly outflows before increasing fixed EMI commitments.")
    return tips


def _loan_safety(signals: FinancialSignals) -> list[str]:
    tips: list[str] = []
    if signals.loan_eligibility_band == "premium":
        tips.append("Eligible for premium low-risk loan products with favorable pricing.")
    elif signals.loan_eligibility_band == "moderate":
        tips.append("Eligible for moderate-risk loan products with standard documentation.")
    elif signals.loan_eligibility_band == "conservative":
        tips.append("Limit new borrowing to secured or short-tenor facilities until scores improve.")
    else:
        tips.append("Defer new loan applications until repayment and savings signals strengthen.")
    return tips


def _spending_insights(signals: FinancialSignals) -> list[str]:
    tips: list[str] = []
    if signals.spending_stability >= 78:
        tips.append("Transaction patterns show low volatility — favorable for adaptive underwriting.")
    elif signals.spending_stability >= 65:
        tips.append("Spending shows moderate volatility — consolidate discretionary categories.")
    else:
        tips.append("High spending volatility detected — implement weekly spend caps on discretionary lines.")
    return tips


def _trust_improvement(signals: FinancialSignals) -> list[str]:
    tips: list[str] = []
    if signals.trust_score >= 80:
        tips.append("Trust score is in the top quartile — maintain signal consistency for premium tier lock-in.")
    elif signals.trust_score >= 65:
        tips.append("Lift trust index by +5–8 points via sustained savings and on-time repayments over 90 days.")
    else:
        tips.append("Focus on repayment cadence and savings regularity to accelerate trust velocity.")
    if signals.credit_health < 70:
        tips.append("Improve credit utilization below 30% to unlock credit-health component gains.")
    return tips


def build_recommendations(signals: FinancialSignals) -> list[str]:
    """Aggregate categorized advisory recommendations."""
    pool: list[str] = []
    pool.extend(_savings_advice(signals))
    pool.extend(_emi_advice(signals))
    pool.extend(_loan_safety(signals))
    pool.extend(_spending_insights(signals))
    pool.extend(_trust_improvement(signals))

    seen: set[str] = set()
    unique: list[str] = []
    for tip in pool:
        key = tip.lower()
        if key not in seen:
            seen.add(key)
            unique.append(tip)
    return unique[:7]


def build_risk_warnings(signals: FinancialSignals) -> list[str]:
    warnings: list[str] = []
    if signals.savings_discipline < 78:
        warnings.append("Savings trend slightly declined this month.")
    if signals.spending_stability < 68:
        warnings.append("Spending volatility may elevate short-term liquidity risk.")
    if signals.repayment_strength < 72:
        warnings.append("Repayment consistency below optimal threshold for premium trust tier.")
    if signals.risk_level in ("ELEVATED", "HIGH"):
        warnings.append(f"Risk classification is {signals.risk_level} — monitor cash buffers closely.")
    if signals.trust_momentum < 60:
        warnings.append("Trust momentum is decelerating — intervene on behavioral signals early.")
    if not warnings:
        warnings.append("No material risk escalations detected in the current observation window.")
    return warnings[:5]


def build_insights(signals: FinancialSignals) -> list[AdvisorInsight]:
    insights: list[AdvisorInsight] = [
        AdvisorInsight(
            category="Savings",
            title="Savings discipline",
            detail=f"Consistency index at {signals.savings_discipline:.0f}% — {'strong' if signals.savings_discipline >= 75 else 'needs attention'}.",
            priority="high" if signals.savings_discipline < 65 else "medium",
        ),
        AdvisorInsight(
            category="EMI",
            title="Repayment capacity",
            detail=f"Repayment strength {signals.repayment_strength:.0f}% supports {'aggressive' if signals.repayment_strength >= 85 else 'balanced'} EMI structuring.",
            priority="medium",
        ),
        AdvisorInsight(
            category="Spending",
            title="Spending stability",
            detail=f"Transaction stability at {signals.spending_stability:.0f}% — {'within institutional comfort band' if signals.spending_stability >= 72 else 'review discretionary outflows'}.",
            priority="high" if signals.spending_stability < 65 else "low",
        ),
        AdvisorInsight(
            category="Trust",
            title="Trust trajectory",
            detail=f"Trust index {signals.trust_score} with {signals.financial_reliability} reliability classification.",
            priority="medium",
        ),
    ]
    return insights


def build_summary_response(signals: FinancialSignals) -> AdvisorSummaryResponse:
    health = compute_financial_health_score(signals)
    return AdvisorSummaryResponse(
        advisor_summary=_build_summary(signals, health),
        recommendations=build_recommendations(signals),
        risk_warnings=build_risk_warnings(signals),
        financial_health_score=health,
        trust_score=signals.trust_score,
        risk_level=signals.risk_level,
        financial_reliability=signals.financial_reliability,
        insights=build_insights(signals),
    )


def build_recommendations_response(signals: FinancialSignals) -> RecommendationsResponse:
    return RecommendationsResponse(recommendations=build_recommendations(signals))


def build_risk_analysis(signals: FinancialSignals) -> RiskAnalysisResponse:
    factors: list[str] = []
    if signals.spending_stability < 70:
        factors.append("Elevated transaction volatility")
    if signals.savings_discipline < 72:
        factors.append("Savings consistency softening")
    if signals.repayment_strength < 75:
        factors.append("Repayment signal degradation")
    if signals.credit_health < 70:
        factors.append("Credit health below institutional benchmark")
    if not factors:
        factors.append("Core behavioral signals within acceptable tolerance")

    mitigation: list[str] = []
    if signals.spending_stability < 70:
        mitigation.append("Enable spend alerts and weekly category budgets.")
    if signals.savings_discipline < 72:
        mitigation.append("Automate savings sweeps on salary credit dates.")
    if signals.repayment_strength < 75:
        mitigation.append("Set auto-debit for all EMI obligations 2 days before due date.")
    if not mitigation:
        mitigation.append("Continue current financial discipline to preserve risk posture.")

    return RiskAnalysisResponse(
        risk_level=signals.risk_level,
        risk_warnings=build_risk_warnings(signals),
        risk_factors=factors,
        mitigation_steps=mitigation,
    )


def build_financial_health(signals: FinancialSignals) -> FinancialHealthResponse:
    health = compute_financial_health_score(signals)
    return FinancialHealthResponse(
        financial_health_score=health,
        advisor_summary=_build_summary(signals, health),
        dimensions={
            "repayment_behavior": round(signals.repayment_strength, 1),
            "savings_consistency": round(signals.savings_discipline, 1),
            "spending_stability": round(signals.spending_stability, 1),
            "credit_health": round(signals.credit_health, 1),
            "salary_stability": round(signals.salary_stability, 1),
            "trust_index": float(signals.trust_score),
        },
    )
