"""
Helpers for gateway → downstream HTTP proxy responses.
"""

import logging
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("trust.gateway.proxy")

# Paths that belong to the gateway public API only — never prepend to downstream URLs.
_GATEWAY_PUBLIC_PREFIXES = (
    "/api/advisor",
    "/api/monitoring",
    "/api/fraud",
    "/api/twin",
    "/api/trust",
    "/api/gold-loan",
    "/api/loan",
    "/api/auth",
)


def _parse_json_body(resp: httpx.Response) -> Any:
    """Always return JSON-serializable content for the frontend."""
    content_type = (resp.headers.get("content-type") or "").lower()
    if "application/json" in content_type:
        try:
            return resp.json()
        except ValueError:
            pass
    text = (resp.text or "").strip()
    if not text:
        return {"success": False, "message": "Empty upstream response"}
    return {"success": False, "message": text[:2000]}


def downstream_json_response(resp: httpx.Response, *, downstream_url: str) -> JSONResponse:
    """Build a JSONResponse from an httpx downstream response."""
    content = _parse_json_body(resp)
    return JSONResponse(status_code=resp.status_code, content=content)


def build_downstream_url(base_url: str, downstream_path: str) -> str:
    """
    Join service base URL with the exact path exposed by the downstream FastAPI app.

    ``downstream_path`` must match the target service route (e.g. ``/advisor/summary``,
    ``/services-status``), not the gateway public path (``/api/advisor/summary``).
    """
    raw = base_url.strip().rstrip("/")
    downstream = (
        downstream_path if downstream_path.startswith("/") else f"/{downstream_path}"
    )

    parsed = urlparse(raw)
    if not parsed.scheme or not parsed.netloc:
        return f"{raw}{downstream}"

    origin = f"{parsed.scheme}://{parsed.netloc}"
    base_path = (parsed.path or "").rstrip("/")

    if not base_path:
        return f"{origin}{downstream}"

    if base_path in _GATEWAY_PUBLIC_PREFIXES:
        logger.warning(
            "Service base URL contains gateway path %r; forwarding to %s%s",
            base_path,
            origin,
            downstream,
        )
        return f"{origin}{downstream}"

    if downstream == base_path or downstream.startswith(f"{base_path}/"):
        return f"{origin}{downstream}"

    if not downstream.startswith(base_path):
        return f"{origin}{base_path}{downstream}"

    return f"{origin}{downstream}"


async def proxy_downstream_request(
    request: Request,
    *,
    base_url: str,
    downstream_path: str,
    log: logging.Logger | None = None,
    json_body: dict | None = None,
) -> JSONResponse:
    """Forward the incoming request to a downstream microservice with safe httpx handling."""
    route_logger = log or logger
    incoming = request.url.path
    url = build_downstream_url(base_url, downstream_path)
    route_logger.info(
        "Proxy incoming_route=%s final_downstream_url=%s method=%s",
        incoming,
        url,
        request.method,
    )

    if json_body is None:
        try:
            json_body = await request.json()
        except Exception:
            json_body = None

    headers: dict[str, str] = {"Accept": "application/json"}
    auth_header = request.headers.get("authorization")
    if auth_header:
        headers["Authorization"] = auth_header

    try:
        kwargs: dict[str, Any] = {
            "method": request.method,
            "url": url,
            "headers": headers,
            "params": request.query_params,
        }
        if json_body is not None:
            kwargs["json"] = json_body

        timeout = httpx.Timeout(10.0, connect=5.0)
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.request(**kwargs)

        response_preview = (resp.text or "")[:2000]
        route_logger.info(
            "Proxy downstream_status=%s incoming_route=%s final_downstream_url=%s response_text=%s",
            resp.status_code,
            incoming,
            url,
            response_preview,
        )
        if resp.status_code >= 400:
            route_logger.warning(
                "Proxy upstream HTTP error status=%s url=%s body=%s",
                resp.status_code,
                url,
                response_preview,
            )

        return downstream_json_response(resp, downstream_url=url)

    except httpx.TimeoutException as exc:
        route_logger.error(
            "Proxy timeout incoming_route=%s final_downstream_url=%s reason=%s",
            incoming,
            url,
            str(exc),
        )
        return JSONResponse(
            status_code=504,
            content={
                "success": False,
                "error": "gateway_timeout",
                "detail": str(exc),
                "url": url,
            },
        )
    except httpx.RequestError as exc:
        route_logger.error(
            "Proxy upstream unreachable incoming_route=%s final_downstream_url=%s reason=%s",
            incoming,
            url,
            str(exc),
        )
        return JSONResponse(
            status_code=502,
            content={
                "success": False,
                "error": "upstream_unreachable",
                "detail": str(exc),
                "url": url,
            },
        )
    except Exception as exc:
        route_logger.error(
            "Proxy internal error incoming_route=%s final_downstream_url=%s reason=%s",
            incoming,
            url,
            str(exc),
        )
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "gateway_internal_error",
                "detail": str(exc),
                "url": url,
            },
        )
