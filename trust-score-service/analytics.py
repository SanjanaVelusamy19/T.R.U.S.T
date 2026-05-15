"""
Visualization-ready analytics payloads for TRUST graph dashboard.
"""

from __future__ import annotations

from components import clamp, component_scores, ComponentScores
from models import (
    AnalyticsCard,
    EmploymentType,
    RadarDimension,
    RiskIndicators,
    TimelinePoint,
    TrustScoreRequest,
    TrustVisualization,
)

MONTH_LABELS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")


def _trust_confidence(trust_score: int) -> float:
    return round(min(100.0, max(0.0, trust_score * 0.92 + 6)), 1)


def _financial_safety(trust_score: int, components: ComponentScores) -> float:
    blend = (
        components.repayment * 0.35
        + components.savings * 0.25
        + components.transaction * 0.2
        + trust_score * 0.2
    )
    return round(clamp(blend), 1)


def build_timeline(current_score: int, months: int = 6) -> list[TimelinePoint]:
    """Generate progressive historical trust scores ending at the current index."""
    start = max(40, current_score - 18)
    step = (current_score - start) / max(1, months - 1)
    offset = max(0, 12 - months)
    labels = MONTH_LABELS[offset : offset + months]
    return [
        TimelinePoint(month=label, score=int(round(start + step * i)))
        for i, label in enumerate(labels)
    ]


def build_radar(components: ComponentScores) -> list[RadarDimension]:
    return [
        RadarDimension(label="Salary Stability", value=round(components.salary, 1)),
        RadarDimension(label="Credit Health", value=round(components.credit, 1)),
        RadarDimension(label="Repayment History", value=round(components.repayment, 1)),
        RadarDimension(label="Savings Consistency", value=round(components.savings, 1)),
        RadarDimension(label="Transaction Stability", value=round(components.transaction, 1)),
    ]


def build_analytics_cards(components: ComponentScores, trust_score: int) -> list[AnalyticsCard]:
    behavioral = round((components.transaction + components.repayment) / 2, 1)
    momentum = round(clamp(trust_score - 68 + components.savings * 0.08), 1)
    return [
        AnalyticsCard(
            label="Financial Reliability",
            value=round((components.salary + components.credit) / 2, 1),
            trend="+4.2%" if trust_score >= 70 else None,
        ),
        AnalyticsCard(
            label="Behavioral Stability",
            value=behavioral,
            trend="+2.8%" if behavioral >= 75 else None,
        ),
        AnalyticsCard(
            label="Savings Discipline",
            value=round(components.savings, 1),
            trend="+6.1%" if components.savings >= 80 else None,
        ),
        AnalyticsCard(
            label="Repayment Strength",
            value=round(components.repayment, 1),
            trend="+12%" if components.repayment >= 85 else None,
        ),
        AnalyticsCard(
            label="Trust Momentum",
            value=momentum,
            trend="Accelerating" if momentum >= 75 else "Steady",
        ),
    ]


def build_insights(components: ComponentScores, trust_score: int) -> list[str]:
    insights: list[str] = []
    if components.repayment >= 80:
        delta = int(min(18, components.repayment - 68))
        insights.append(f"Your repayment consistency improved by {delta}%")
    if components.savings >= 75:
        insights.append("Savings stability indicates strong financial discipline")
    if components.credit >= 78:
        insights.append("Credit health supports premium institutional trust positioning")
    if components.transaction >= 72:
        insights.append("Transaction patterns show low volatility — favorable for lending")
    if trust_score >= 80:
        insights.append("Trust momentum is in the top quartile for adaptive credit surfaces")
    elif trust_score < 55:
        insights.append("Focus on repayment cadence and savings regularity to lift trust velocity")
    if not insights:
        insights.append("Maintain current financial signals to preserve trust index stability")
    return insights[:5]


def build_visualization(
    payload: TrustScoreRequest,
    trust_score: int,
    risk_level: str,
) -> TrustVisualization:
    components = component_scores(payload)
    return TrustVisualization(
        timeline=build_timeline(trust_score),
        radar=build_radar(components),
        analytics_cards=build_analytics_cards(components, trust_score),
        risk_indicators=RiskIndicators(
            risk_level=risk_level,
            trust_confidence=_trust_confidence(trust_score),
            financial_safety_score=_financial_safety(trust_score, components),
        ),
        insights=build_insights(components, trust_score),
    )


def default_dashboard_payload() -> dict:
    """Baseline dashboard snapshot when no live calculation has been run."""
    sample = TrustScoreRequest(
        salary=72000,
        credit_score=760,
        repayment_history=88,
        savings_consistency=82,
        transaction_stability=76,
        employment_type=EmploymentType.SALARIED,
    )
    trust_score = 78
    visualization = build_visualization(sample, trust_score, "LOW")
    return {
        "success": True,
        "trust_score": trust_score,
        "financial_reliability": "HIGH",
        "risk_level": "LOW",
        **visualization.model_dump(),
    }
