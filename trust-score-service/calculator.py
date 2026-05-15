"""
TRUST Index business logic — weighted adaptive scoring isolated from transport layer.

Weights:
- Salary stability: 25%
- Credit score: 25%
- Repayment history: 20%
- Savings consistency: 15%
- Transaction stability: 10%
- Employment reliability: 5%
"""

from analytics import build_visualization
from components import clamp, component_scores
from models import TrustScoreRequest, TrustScoreResponse

WEIGHT_SALARY = 0.25
WEIGHT_CREDIT = 0.25
WEIGHT_REPAYMENT = 0.20
WEIGHT_SAVINGS = 0.15
WEIGHT_TRANSACTION = 0.10
WEIGHT_EMPLOYMENT = 0.05


def _classify_risk(trust_score: int) -> str:
    if trust_score >= 80:
        return "LOW"
    if trust_score >= 60:
        return "MEDIUM"
    if trust_score >= 40:
        return "ELEVATED"
    return "HIGH"


def _classify_reliability(trust_score: int) -> str:
    if trust_score >= 75:
        return "HIGH"
    if trust_score >= 50:
        return "MODERATE"
    return "LOW"


def _build_recommendations(components, payload: TrustScoreRequest) -> list[str]:
    tips: list[str] = []

    if components.repayment >= 85:
        tips.append("Excellent repayment behavior detected")
    elif components.repayment < 70:
        tips.append("Improve on-time repayment consistency to strengthen trust signals")

    if components.savings >= 80:
        tips.append("Maintain consistent savings habits")
    elif components.savings < 60:
        tips.append("Increase recurring savings deposits to improve stability metrics")

    if components.credit >= 80:
        tips.append("Credit profile supports premium trust tier positioning")
    elif components.credit < 65:
        tips.append("Focus on credit utilization and timely bill payments")

    if components.transaction < 65:
        tips.append("Reduce volatile transaction patterns for stronger behavioral stability")

    from models import EmploymentType

    if payload.employment_type == EmploymentType.UNEMPLOYED:
        tips.append("Stable employment income will materially improve trust classification")

    if components.salary < 55:
        tips.append("Income growth or verified salary stability can lift salary component weighting")

    if not tips:
        tips.append("Continue current financial discipline to preserve trust index momentum")

    return tips[:5]


def calculate_trust_score(payload: TrustScoreRequest) -> TrustScoreResponse:
    """Compute weighted TRUST index and derived analytics."""
    components = component_scores(payload)

    raw = (
        components.salary * WEIGHT_SALARY
        + components.credit * WEIGHT_CREDIT
        + components.repayment * WEIGHT_REPAYMENT
        + components.savings * WEIGHT_SAVINGS
        + components.transaction * WEIGHT_TRANSACTION
        + components.employment * WEIGHT_EMPLOYMENT
    )
    trust_score = int(round(clamp(raw)))
    risk_level = _classify_risk(trust_score)
    visualization = build_visualization(payload, trust_score, risk_level)

    return TrustScoreResponse(
        trust_score=trust_score,
        risk_level=risk_level,
        financial_reliability=_classify_reliability(trust_score),
        recommendations=_build_recommendations(components, payload),
        timeline=visualization.timeline,
        radar=visualization.radar,
        analytics_cards=visualization.analytics_cards,
        risk_indicators=visualization.risk_indicators,
        insights=visualization.insights,
    )
