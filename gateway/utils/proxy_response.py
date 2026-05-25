"""
Helpers for gateway → downstream HTTP proxy responses.
"""

import logging
from typing import Any

import httpx
from fastapi.responses import JSONResponse

logger = logging.getLogger("trust.gateway.proxy")


def _response_content(resp: httpx.Response) -> Any:
    content_type = (resp.headers.get("content-type") or "").lower()
    if "application/json" in content_type:
        try:
            return resp.json()
        except ValueError:
            return {"message": resp.text[:500] if resp.text else ""}
    return {"message": resp.text[:500] if resp.text else ""}


def downstream_json_response(resp: httpx.Response, *, downstream_url: str) -> JSONResponse:
    """
    Build a JSONResponse from an httpx downstream response.
    """
    logger.info(
        "downstream response url=%s status=%s",
        downstream_url,
        resp.status_code,
    )
    content = _response_content(resp)
    return JSONResponse(status_code=resp.status_code, content=content)
