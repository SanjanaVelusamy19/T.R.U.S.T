"""Fetch trust analytics from the trust-score microservice."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from config import get_settings
from signals import FinancialSignals, default_signals, signals_from_trust_payload

logger = logging.getLogger("trust.advisor.trust_client")


async def load_financial_signals() -> FinancialSignals:
    """Pull live trust dashboard signals or fall back to baseline profile."""
    settings = get_settings()
    url = f"{settings.trust_score_service_url.rstrip('/')}/analytics/dashboard"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
        if resp.status_code != 200:
            logger.warning("Trust service returned %s for dashboard", resp.status_code)
            return default_signals()
        payload: dict[str, Any] = resp.json()
        return signals_from_trust_payload(payload)
    except Exception as exc:
        logger.warning("Unable to load trust signals: %s", exc)
        return default_signals()
