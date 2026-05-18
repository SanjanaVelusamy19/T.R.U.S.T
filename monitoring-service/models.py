"""Pydantic schemas for ecosystem monitoring and self-healing telemetry."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class ServiceStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    DOWN = "DOWN"
    RECOVERING = "RECOVERING"


class SystemStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    CRITICAL = "CRITICAL"


class ServiceHealth(BaseModel):
    name: str
    key: str
    status: ServiceStatus
    latency_ms: float
    uptime_percent: float = Field(..., ge=0, le=100)
    last_checked: str
    retries_used: int = 0
    recovered: bool = False


class LatencyMetric(BaseModel):
    service: str
    latency_ms: float
    baseline_ms: float
    delta_ms: float


class HealthHistoryPoint(BaseModel):
    timestamp: str
    system_status: SystemStatus
    healthy_services: int
    active_services: int
    avg_latency_ms: float


class SelfHealingEvent(BaseModel):
    timestamp: str
    service: str
    action: str
    outcome: str
    detail: str


class SystemHealthResponse(BaseModel):
    success: bool = True
    system_status: SystemStatus
    active_services: int
    healthy_services: int
    gateway_latency_ms: float
    failed_requests: int
    alerts: list[str]
    adaptive_alerts: list[str]
    services: list[ServiceHealth]
    latency_metrics: list[LatencyMetric]
    health_history: list[HealthHistoryPoint]
    self_healing_events: list[SelfHealingEvent]


class ServicesResponse(BaseModel):
    success: bool = True
    services: list[ServiceHealth]


class MonitorAlertsResponse(BaseModel):
    success: bool = True
    alerts: list[str]
    adaptive_alerts: list[str]


class LatencyResponse(BaseModel):
    success: bool = True
    gateway_latency_ms: float
    metrics: list[LatencyMetric]


class HealthHistoryResponse(BaseModel):
    success: bool = True
    history: list[HealthHistoryPoint]
    self_healing_events: list[SelfHealingEvent]
