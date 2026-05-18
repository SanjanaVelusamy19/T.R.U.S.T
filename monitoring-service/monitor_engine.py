"""
Ecosystem health aggregation, latency tracking, and self-healing probe simulation.
"""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone

import httpx

from config import Settings, get_settings
from health_store import STORE
from models import (
    HealthHistoryPoint,
    HealthHistoryResponse,
    LatencyMetric,
    LatencyResponse,
    MonitorAlertsResponse,
    ServiceHealth,
    ServiceStatus,
    ServicesResponse,
    SystemHealthResponse,
    SystemStatus,
)

logger = logging.getLogger("trust.monitor.engine")


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _service_registry(settings: Settings) -> list[tuple[str, str, str]]:
    return [
        ("Auth Service", "auth", settings.auth_service_url),
        ("Loan Service", "loan", settings.loan_service_url),
        ("Trust Score Service", "trust", settings.trust_score_service_url),
        ("Advisor Service", "advisor", settings.advisor_service_url),
        ("Fraud Detection Service", "fraud", settings.fraud_detection_service_url),
        ("API Gateway", "gateway", settings.gateway_service_url),
        ("Monitoring Service", "monitoring", "self"),
    ]


async def _probe_health(
    client: httpx.AsyncClient,
    base_url: str,
    *,
    retries: int,
    timeout: float,
) -> tuple[bool, float, int]:
    """Probe /health with self-healing retries. Returns ok, latency_ms, retries_used."""
    url = f"{base_url.rstrip('/')}/health"
    retries_used = 0
    latency_ms = 0.0

    for attempt in range(1, retries + 1):
        retries_used = attempt
        start = time.perf_counter()
        try:
            resp = await client.get(url, timeout=timeout)
            latency_ms = (time.perf_counter() - start) * 1000
            if resp.status_code == 200:
                return True, round(latency_ms, 1), retries_used
        except Exception as exc:
            latency_ms = (time.perf_counter() - start) * 1000
            logger.warning("Health probe failed url=%s attempt=%s error=%s", url, attempt, exc)

        if attempt < retries:
            await asyncio.sleep(0.35 * attempt)

    return False, round(latency_ms, 1), retries_used


def _status_from_probe(
    ok: bool,
    latency_ms: float,
    baseline_ms: float,
    warning_delta: int,
    *,
    retries_used: int,
    max_retries: int,
) -> ServiceStatus:
    if not ok:
        if retries_used >= max_retries:
            return ServiceStatus.DOWN
        return ServiceStatus.RECOVERING
    if latency_ms > baseline_ms + warning_delta * 2:
        return ServiceStatus.DEGRADED
    if latency_ms > baseline_ms + warning_delta:
        return ServiceStatus.DEGRADED
    return ServiceStatus.HEALTHY


def _uptime_percent(status: ServiceStatus, consecutive_failures: int) -> float:
    if status == ServiceStatus.HEALTHY:
        return 99.9
    if status == ServiceStatus.DEGRADED:
        return max(95.0, 99.5 - consecutive_failures * 1.2)
    if status == ServiceStatus.RECOVERING:
        return max(90.0, 97.0 - consecutive_failures * 2)
    return max(75.0, 88.0 - consecutive_failures * 3)


async def collect_ecosystem_health(*, persist_history: bool = True) -> SystemHealthResponse:
    settings = get_settings()
    registry = _service_registry(settings)
    services: list[ServiceHealth] = []
    alerts: list[str] = []
    adaptive_alerts: list[str] = []
    latency_metrics: list[LatencyMetric] = []

    async with httpx.AsyncClient() as client:
        for name, key, base_url in registry:
            if base_url == "self":
                latency_ms = 1.0
                ok = True
                retries_used = 0
            else:
                ok, latency_ms, retries_used = await _probe_health(
                    client,
                    base_url,
                    retries=settings.health_check_retries,
                    timeout=settings.health_check_timeout_sec,
                )

            state = STORE.service_state(key)
            if not ok:
                STORE.record_failure()

            if ok:
                STORE.update_baseline(key, latency_ms)

            baseline = state.baseline_latency_ms
            status = _status_from_probe(
                ok,
                latency_ms,
                baseline,
                settings.latency_warning_delta_ms,
                retries_used=retries_used,
                max_retries=settings.health_check_retries,
            )

            recovered = STORE.transition_status(
                key,
                name,
                status,
                retries_used=retries_used,
            )

            delta = round(latency_ms - baseline, 1)
            latency_metrics.append(
                LatencyMetric(
                    service=name,
                    latency_ms=latency_ms,
                    baseline_ms=baseline,
                    delta_ms=delta,
                )
            )

            if status == ServiceStatus.DEGRADED and delta >= settings.latency_warning_delta_ms:
                alerts.append(f"{name} latency increased by {int(delta)}ms")
            if status == ServiceStatus.DOWN:
                alerts.append(f"{name} is unreachable after self-healing retries.")
                adaptive_alerts.append(
                    f"Adaptive orchestrator flagged {name} — recovery probes exhausted."
                )
            if recovered:
                adaptive_alerts.append(f"Self-healing: {name} automatically marked RESTORED.")

            services.append(
                ServiceHealth(
                    name=name,
                    key=key,
                    status=status,
                    latency_ms=latency_ms,
                    uptime_percent=_uptime_percent(status, state.consecutive_failures),
                    last_checked=_utc_now(),
                    retries_used=retries_used,
                    recovered=recovered,
                )
            )

    healthy = sum(1 for s in services if s.status == ServiceStatus.HEALTHY)
    active = len(services)
    down_count = sum(1 for s in services if s.status == ServiceStatus.DOWN)
    degraded_count = sum(1 for s in services if s.status == ServiceStatus.DEGRADED)

    gateway_latency = next(
        (s.latency_ms for s in services if s.key == "gateway"),
        0.0,
    )

    if down_count > 0 or any(s.key == "gateway" and s.status == ServiceStatus.DOWN for s in services):
        system_status = SystemStatus.CRITICAL
    elif degraded_count > 0 or healthy < active:
        system_status = SystemStatus.DEGRADED
    else:
        system_status = SystemStatus.HEALTHY

    avg_latency = round(
        sum(s.latency_ms for s in services) / max(1, len(services)),
        1,
    )
    if persist_history:
        STORE.record_history(
            HealthHistoryPoint(
                timestamp=_utc_now(),
                system_status=system_status,
                healthy_services=healthy,
                active_services=active,
                avg_latency_ms=avg_latency,
            )
        )

    if system_status == SystemStatus.HEALTHY and not alerts:
        adaptive_alerts.append("Infrastructure stability within adaptive tolerance — all probes nominal.")

    return SystemHealthResponse(
        system_status=system_status,
        active_services=active,
        healthy_services=healthy,
        gateway_latency_ms=gateway_latency,
        failed_requests=STORE.failed_requests,
        alerts=alerts,
        adaptive_alerts=adaptive_alerts,
        services=services,
        latency_metrics=latency_metrics,
        health_history=STORE.history,
        self_healing_events=STORE.healing_events,
    )


async def build_services_response() -> ServicesResponse:
    snapshot = await collect_ecosystem_health(persist_history=False)
    return ServicesResponse(services=snapshot.services)


async def build_alerts_response() -> MonitorAlertsResponse:
    snapshot = await collect_ecosystem_health(persist_history=False)
    return MonitorAlertsResponse(
        alerts=snapshot.alerts,
        adaptive_alerts=snapshot.adaptive_alerts,
    )


async def build_latency_response() -> LatencyResponse:
    snapshot = await collect_ecosystem_health(persist_history=False)
    return LatencyResponse(
        gateway_latency_ms=snapshot.gateway_latency_ms,
        metrics=snapshot.latency_metrics,
    )


async def build_health_history_response() -> HealthHistoryResponse:
    await collect_ecosystem_health(persist_history=True)
    return HealthHistoryResponse(
        history=STORE.history,
        self_healing_events=STORE.healing_events,
    )
