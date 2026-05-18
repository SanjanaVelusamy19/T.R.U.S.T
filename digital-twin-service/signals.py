"""Normalize trust analytics into digital-twin baseline signals."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class TwinBaseline:
    trust_score: int
    risk_level: str
    savings_discipline: float
    spending_stability: float
    repayment_strength: float
    credit_health: float
    salary_stability: float
    trust_momentum: float
    timeline_scores: tuple[int, ...]


MONTH_LABELS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")


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


def _timeline_scores(timeline: list[dict]) -> tuple[int, ...]:
    scores: list[int] = []
    for point in timeline:
        if "score" in point:
            scores.append(int(point["score"]))
    return tuple(scores) if scores else (72, 74, 76, 78, 79, 80)


def baseline_from_trust_payload(payload: dict[str, Any]) -> TwinBaseline:
    cards = payload.get("analytics_cards") or []
    radar = payload.get("radar") or []
    timeline = payload.get("timeline") or []
    trust_score = int(payload.get("trust_score", 78))
    risk_level = str(payload.get("risk_level", "MEDIUM"))

    savings = _radar_value(radar, "Savings Consistency", _card_value(cards, "Savings Discipline"))
    spending = _radar_value(radar, "Transaction Stability", _card_value(cards, "Behavioral Stability"))
    repayment = _radar_value(radar, "Repayment History", _card_value(cards, "Repayment Strength"))
    credit = _radar_value(radar, "Credit Health", _card_value(cards, "Financial Reliability"))
    salary = _radar_value(radar, "Salary Stability", 75.0)
    momentum = _card_value(cards, "Trust Momentum", float(trust_score))

    return TwinBaseline(
        trust_score=trust_score,
        risk_level=risk_level.upper(),
        savings_discipline=savings,
        spending_stability=spending,
        repayment_strength=repayment,
        credit_health=credit,
        salary_stability=salary,
        trust_momentum=momentum,
        timeline_scores=_timeline_scores(timeline),
    )


def default_baseline() -> TwinBaseline:
    return TwinBaseline(
        trust_score=78,
        risk_level="MEDIUM",
        savings_discipline=74.0,
        spending_stability=72.0,
        repayment_strength=76.0,
        credit_health=75.0,
        salary_stability=75.0,
        trust_momentum=72.0,
        timeline_scores=(70, 72, 74, 76, 77, 78),
    )
