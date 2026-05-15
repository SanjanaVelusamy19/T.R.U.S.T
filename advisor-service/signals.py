"""Normalize trust analytics into advisor-ready financial signals."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class FinancialSignals:
    trust_score: int
    risk_level: str
    financial_reliability: str
    repayment_strength: float
    savings_discipline: float
    spending_stability: float
    credit_health: float
    salary_stability: float
    trust_momentum: float
    loan_eligibility_band: str


def _card_value(cards: list[dict], label: str, default: float = 70.0) -> float:
    for card in cards:
        if card.get("label") == label:
            return float(card.get("value", default))
    return default


def _radar_value(radar: list[dict], label: str, default: float = 70.0) -> float:
    for point in radar:
        if point.get("label") == label:
            return float(point.get("value", default))
    return default


def signals_from_trust_payload(payload: dict[str, Any]) -> FinancialSignals:
    """Map trust-score dashboard JSON into advisor signals."""
    cards = payload.get("analytics_cards") or []
    radar = payload.get("radar") or []
    indicators = payload.get("risk_indicators") or {}

    trust_score = int(payload.get("trust_score", 78))
    risk_level = str(payload.get("risk_level", indicators.get("risk_level", "MEDIUM")))
    reliability = str(payload.get("financial_reliability", "MODERATE"))

    repayment = _radar_value(radar, "Repayment History", _card_value(cards, "Repayment Strength"))
    savings = _radar_value(radar, "Savings Consistency", _card_value(cards, "Savings Discipline"))
    spending = _radar_value(radar, "Transaction Stability", _card_value(cards, "Behavioral Stability"))
    credit = _radar_value(radar, "Credit Health", _card_value(cards, "Financial Reliability"))
    salary = _radar_value(radar, "Salary Stability", 75.0)
    momentum = _card_value(cards, "Trust Momentum", float(trust_score))

    if trust_score >= 80 and risk_level == "LOW":
        loan_band = "premium"
    elif trust_score >= 65:
        loan_band = "moderate"
    elif trust_score >= 50:
        loan_band = "conservative"
    else:
        loan_band = "restricted"

    return FinancialSignals(
        trust_score=trust_score,
        risk_level=risk_level.upper(),
        financial_reliability=reliability.upper(),
        repayment_strength=repayment,
        savings_discipline=savings,
        spending_stability=spending,
        credit_health=credit,
        salary_stability=salary,
        trust_momentum=momentum,
        loan_eligibility_band=loan_band,
    )


def default_signals() -> FinancialSignals:
    """Baseline profile when trust analytics are unavailable."""
    return FinancialSignals(
        trust_score=78,
        risk_level="LOW",
        financial_reliability="HIGH",
        repayment_strength=88.0,
        savings_discipline=82.0,
        spending_stability=76.0,
        credit_health=84.0,
        salary_stability=79.0,
        trust_momentum=75.0,
        loan_eligibility_band="moderate",
    )
