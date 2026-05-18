"""Fetch trust analytics for digital twin baseline modeling."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from config import get_settings
from signals import TwinBaseline, baseline_from_trust_payload, default_baseline

logger = logging.getLogger("trust.twin.trust_client")


async def load_twin_baseline() -> TwinBaseline:
    settings = get_settings()
    url = f"{settings.trust_score_service_url.rstrip('/')}/analytics/dashboard"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
        if resp.status_code != 200:
            logger.warning("Trust service returned %s for dashboard", resp.status_code)
            return default_baseline()
        payload: dict[str, Any] = resp.json()
        return baseline_from_trust_payload(payload)
    except Exception as exc:
        logger.warning("Unable to load trust baseline for digital twin: %s", exc)
        return default_baseline()
