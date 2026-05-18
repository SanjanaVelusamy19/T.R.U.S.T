"""In-memory telemetry store for health history and self-healing simulation."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone

from models import HealthHistoryPoint, SelfHealingEvent, ServiceStatus


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


@dataclass
class ServiceState:
    last_status: ServiceStatus = ServiceStatus.HEALTHY
    baseline_latency_ms: float = 80.0
    consecutive_failures: int = 0


class HealthStore:
    """Lightweight state for adaptive monitoring and recovery simulation."""

    def __init__(self, history_limit: int = 36) -> None:
        self._history: deque[HealthHistoryPoint] = deque(maxlen=history_limit)
        self._healing_events: deque[SelfHealingEvent] = deque(maxlen=24)
        self._service_states: dict[str, ServiceState] = {}
        self.failed_requests: int = 0

    def service_state(self, key: str) -> ServiceState:
        if key not in self._service_states:
            self._service_states[key] = ServiceState()
        return self._service_states[key]

    def record_failure(self) -> None:
        self.failed_requests += 1

    def update_baseline(self, key: str, latency_ms: float) -> None:
        state = self.service_state(key)
        if state.baseline_latency_ms <= 0:
            state.baseline_latency_ms = latency_ms
            return
        state.baseline_latency_ms = round(state.baseline_latency_ms * 0.85 + latency_ms * 0.15, 1)

    def record_history(self, point: HealthHistoryPoint) -> None:
        self._history.append(point)

    def record_healing(self, event: SelfHealingEvent) -> None:
        self._healing_events.append(event)

    def transition_status(
        self,
        key: str,
        service_name: str,
        new_status: ServiceStatus,
        *,
        retries_used: int = 0,
    ) -> bool:
        """Return True if service was marked recovered this check."""
        state = self.service_state(key)
        recovered = False
        prior = state.last_status

        if new_status == ServiceStatus.HEALTHY and prior in {
            ServiceStatus.DOWN,
            ServiceStatus.DEGRADED,
            ServiceStatus.RECOVERING,
        }:
            recovered = True
            self.record_healing(
                SelfHealingEvent(
                    timestamp=_utc_now(),
                    service=service_name,
                    action="auto_recovery",
                    outcome="RESTORED",
                    detail=f"Service restored after {retries_used} self-healing probe(s).",
                )
            )

        if new_status == ServiceStatus.DOWN and prior != ServiceStatus.DOWN:
            self.record_healing(
                SelfHealingEvent(
                    timestamp=_utc_now(),
                    service=service_name,
                    action="detect_downtime",
                    outcome="ALERT",
                    detail="Downtime detected — initiating adaptive retry sequence.",
                )
            )

        if new_status == ServiceStatus.DOWN:
            state.consecutive_failures = min(state.consecutive_failures + 1, 24)
        else:
            state.consecutive_failures = 0

        state.last_status = new_status
        return recovered

    @property
    def history(self) -> list[HealthHistoryPoint]:
        return list(self._history)

    @property
    def healing_events(self) -> list[SelfHealingEvent]:
        return list(self._healing_events)


STORE = HealthStore()
