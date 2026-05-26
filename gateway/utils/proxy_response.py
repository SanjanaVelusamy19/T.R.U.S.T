"""
Helpers for gateway → downstream HTTP proxy responses.
"""

import logging
from typing import Any

import httpx
from fastapi import Request
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
    """Build a JSONResponse from an httpx downstream response."""
    logger.info(
        "downstream response url=%s status=%s",
        downstream_url,
        resp.status_code,
    )
    content = _response_content(resp)
    return JSONResponse(status_code=resp.status_code, content=content)


def build_downstream_url(base_url: str, downstream_path: str) -> str:
    """Join base URL (host only) with a path segment; no duplicate slashes."""
    base = base_url.rstrip("/")
    path = downstream_path if downstream_path.startswith("/") else f"/{downstream_path}"
    return f"{base}{path}"


async def proxy_downstream_request(
    request: Request,
    *,
    base_url: str,
    downstream_path: str,
    log: logging.Logger | None = None,
    json_body: dict | None = None,
) -> JSONResponse:
    """
    Forward the incoming request to a downstream microservice with safe httpx handling.
    """
    route_logger = log or logger
    url = build_downstream_url(base_url, downstream_path)
    route_logger.info(
        "Proxy final_url=%s method=%s",
        url,
        request.method,
    )

    if json_body is None:
        try:
            json_body = await request.json()
        except Exception:
            json_body = None

    headers: dict[str, str] = {}
    auth_header = request.headers.get("authorization")
    if auth_header:
        headers["authorization"] = auth_header

    try:
        kwargs: dict[str, Any] = {
            "method": request.method,
            "url": url,
            "headers": headers,
            "params": request.query_params,
        }
        if json_body is not None:
            kwargs["json"] = json_body

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.request(**kwargs)

        route_logger.info(
            "Proxy response final_url=%s status=%s",
            url,
            resp.status_code,
        )
        return downstream_json_response(resp, downstream_url=url)

    except httpx.RequestError as exc:
        route_logger.error(
            "Proxy upstream unreachable final_url=%s reason=%s",
            url,
            str(exc),
        )
        return JSONResponse(
            status_code=502,
            content={"error": "Upstream service unreachable", "detail": str(exc)},
        )
    except Exception as exc:
        route_logger.error(
            "Proxy internal error final_url=%s reason=%s",
            url,
            str(exc),
        )
        return JSONResponse(
            status_code=500,
            content={"error": "Gateway internal error", "detail": str(exc)},
        )
