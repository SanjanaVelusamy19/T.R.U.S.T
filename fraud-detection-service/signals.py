"""Normalize trust analytics into fraud-detection behavioral signals."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class BehavioralSignals:
    trust_score: int
    risk_level: str
    behavioral_stability: float
    repayment_strength: float
    transaction_stability: float
    trust_momentum: float
    timeline_scores: tuple[int, ...]
    login_hour: int
    derived_loan_attempts: int
    derived_request_rate: float
    derived_failed_auth: int


def _card_value(cards: list[dict], label: str, default: float = 70.0) -> float:
    for card in cards:
        if card.get("label") == label:
            return float(card.get("value", default))
    return default


def _timeline_scores(timeline: list[dict]) -> tuple[int, ...]:
    scores: list[int] = []
    for point in timeline:
        if "score" in point:
            scores.append(int(point["score"]))
    return tuple(scores) if scores else (72, 74, 76, 78, 79, 80)


def signals_from_trust_payload(payload: dict[str, Any]) -> BehavioralSignals:
    cards = payload.get("analytics_cards") or []
    timeline = payload.get("timeline") or []
    trust_score = int(payload.get("trust_score", 78))
    risk_level = str(payload.get("risk_level", "MEDIUM"))

    behavioral = _card_value(cards, "Behavioral Stability")
    repayment = _card_value(cards, "Repayment Strength")
    momentum = _card_value(cards, "Trust Momentum", float(trust_score))
    transaction = behavioral * 0.92 + repayment * 0.08

    scores = _timeline_scores(timeline)
    volatility = max(scores) - min(scores) if len(scores) > 1 else 0

    loan_attempts = 1
    if trust_score < 55:
        loan_attempts = 4
    elif trust_score < 65 or behavioral < 60:
        loan_attempts = 3
    elif behavioral < 72:
        loan_attempts = 2

    request_rate = round(max(2.0, 28.0 - behavioral * 0.22 + volatility * 0.4), 1)
    failed_auth = 0
    if trust_score < 50:
        failed_auth = 4
    elif trust_score < 62:
        failed_auth = 2
    elif behavioral < 58:
        failed_auth = 1

    return BehavioralSignals(
        trust_score=trust_score,
        risk_level=risk_level,
        behavioral_stability=behavioral,
        repayment_strength=repayment,
        transaction_stability=transaction,
        trust_momentum=momentum,
        timeline_scores=scores,
        login_hour=datetime.now().hour,
        derived_loan_attempts=loan_attempts,
        derived_request_rate=request_rate,
        derived_failed_auth=failed_auth,
    )


def default_signals() -> BehavioralSignals:
    return BehavioralSignals(
        trust_score=78,
        risk_level="MEDIUM",
        behavioral_stability=74.0,
        repayment_strength=76.0,
        transaction_stability=73.0,
        trust_momentum=72.0,
        timeline_scores=(70, 72, 74, 76, 77, 78),
        login_hour=datetime.now().hour,
        derived_loan_attempts=1,
        derived_request_rate=8.5,
        derived_failed_auth=0,
    )
