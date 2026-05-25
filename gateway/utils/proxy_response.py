"""
Helpers for gateway → downstream HTTP proxy responses.
"""

import logging
from typing import Any

import httpx
from fastapi.responses import JSONResponse

logger = logging.getLogger("trust.gateway.proxy")


def downstream_json_response(resp: httpx.Response, *, downstream_url: str) -> JSONResponse:
    """
    Build a JSONResponse from an httpx downstream response.

    Logs status code; returns 500 if the body is not valid JSON.
    """
    logger.info(
        "downstream response url=%s status=%s",
        downstream_url,
        resp.status_code,
    )
    try:
        content: Any = resp.json()
    except ValueError:
        logger.error(
            "Invalid JSON from downstream url=%s status=%s body=%s",
            downstream_url,
            resp.status_code,
            resp.text[:200],
        )
        return JSONResponse(
            status_code=500,
            content={"error": "Invalid response from service"},
        )
    return JSONResponse(status_code=resp.status_code, content=content)
