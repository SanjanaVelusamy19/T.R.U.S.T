"""Load trust analytics baseline for gold lending adjustments."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import httpx

from config import get_settings

logger = logging.getLogger("trust.gold_loan.trust_client")


@dataclass(frozen=True)
class TrustBaseline:
    trust_score: int
    financial_safety: float
    trust_confidence: float
    repayment_momentum: float


def default_baseline() -> TrustBaseline:
    return TrustBaseline(
        trust_score=72,
        financial_safety=68.0,
        trust_confidence=72.0,
        repayment_momentum=0.0,
    )


def baseline_from_payload(payload: dict[str, Any]) -> TrustBaseline:
    viz = payload.get("visualization") or {}
    metrics = viz.get("metrics") or payload.get("metrics") or {}
    trust_score = int(
        payload.get("trust_score")
        or viz.get("trust_score")
        or metrics.get("trust_score")
        or 72,
    )
    return TrustBaseline(
        trust_score=max(0, min(100, trust_score)),
        financial_safety=float(metrics.get("financial_safety_score", 68.0)),
        trust_confidence=float(metrics.get("trust_confidence", trust_score * 0.92)),
        repayment_momentum=float(metrics.get("momentum", 0.0)),
    )


async def load_trust_baseline() -> TrustBaseline:
    settings = get_settings()
    url = f"{settings.trust_score_service_url.rstrip('/')}/analytics/dashboard"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
        if resp.status_code != 200:
            logger.warning("Trust service returned %s for dashboard", resp.status_code)
            return default_baseline()
        return baseline_from_payload(resp.json())
    except Exception as exc:
        logger.warning("Unable to load trust baseline for gold loan: %s", exc)
        return default_baseline()
