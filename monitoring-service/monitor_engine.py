"""System metrics collection using psutil."""

from __future__ import annotations

from datetime import datetime, timezone

import psutil

from models import (
    CPUMetrics,
    DiskMetrics,
    MemoryMetrics,
    MetricsResponse,
    ProcessStats,
    ResourceStatus,
    ServiceStatusItem,
    ServicesStatusResponse,
    SystemStatusResponse,
)


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _classify_usage(percent: float) -> ResourceStatus:
    if percent >= 90:
        return ResourceStatus.CRITICAL
    if percent >= 75:
        return ResourceStatus.DEGRADED
    return ResourceStatus.HEALTHY


def _overall_status(cpu: float, memory: float, disk: float) -> ResourceStatus:
    levels = [_classify_usage(cpu), _classify_usage(memory), _classify_usage(disk)]
    if ResourceStatus.CRITICAL in levels:
        return ResourceStatus.CRITICAL
    if ResourceStatus.DEGRADED in levels:
        return ResourceStatus.DEGRADED
    return ResourceStatus.HEALTHY


def collect_cpu_metrics() -> CPUMetrics:
    per_cpu = psutil.cpu_percent(interval=0.1, percpu=True)
    return CPUMetrics(
        percent=round(psutil.cpu_percent(interval=0.0), 2),
        count_logical=psutil.cpu_count(logical=True) or 0,
        count_physical=psutil.cpu_count(logical=False) or 0,
        per_cpu_percent=[round(v, 2) for v in per_cpu],
    )


def collect_memory_metrics() -> MemoryMetrics:
    mem = psutil.virtual_memory()
    return MemoryMetrics(
        total_bytes=mem.total,
        available_bytes=mem.available,
        used_bytes=mem.used,
        percent=round(mem.percent, 2),
    )


def collect_disk_metrics() -> DiskMetrics:
    disk = psutil.disk_usage("/")
    return DiskMetrics(
        total_bytes=disk.total,
        used_bytes=disk.used,
        free_bytes=disk.free,
        percent=round(disk.percent, 2),
    )


def collect_top_processes(limit: int = 8) -> list[ProcessStats]:
    processes: list[ProcessStats] = []
    for proc in psutil.process_iter(["pid", "name", "status"]):
        try:
            info = proc.info
            processes.append(
                ProcessStats(
                    pid=int(info["pid"]),
                    name=str(info.get("name") or "unknown"),
                    cpu_percent=round(proc.cpu_percent(interval=0.0), 2),
                    memory_percent=round(proc.memory_percent(), 2),
                    status=str(info.get("status") or "unknown"),
                )
            )
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    processes.sort(key=lambda p: p.cpu_percent, reverse=True)
    return processes[:limit]


def build_metrics_response() -> MetricsResponse:
    cpu = collect_cpu_metrics()
    memory = collect_memory_metrics()
    disk = collect_disk_metrics()
    top_processes = collect_top_processes()
    return MetricsResponse(
        timestamp=_utc_now(),
        cpu=cpu,
        memory=memory,
        disk=disk,
        process_count=len(psutil.pids()),
        top_processes=top_processes,
    )


def build_system_status_response() -> SystemStatusResponse:
    cpu = collect_cpu_metrics()
    memory = collect_memory_metrics()
    disk = collect_disk_metrics()
    status = _overall_status(cpu.percent, memory.percent, disk.percent)
    summaries = {
        ResourceStatus.HEALTHY: "System resources within normal operating thresholds.",
        ResourceStatus.DEGRADED: "One or more resource domains are under elevated load.",
        ResourceStatus.CRITICAL: "Critical resource pressure detected — immediate attention advised.",
    }
    return SystemStatusResponse(
        timestamp=_utc_now(),
        status=status,
        cpu_percent=cpu.percent,
        memory_percent=memory.percent,
        disk_percent=disk.percent,
        process_count=len(psutil.pids()),
        summary=summaries[status],
    )


def build_services_status_response() -> ServicesStatusResponse:
    cpu = collect_cpu_metrics()
    memory = collect_memory_metrics()
    disk = collect_disk_metrics()
    process_count = len(psutil.pids())

    services = [
        ServiceStatusItem(
            name="CPU Monitor",
            status=_classify_usage(cpu.percent),
            metric="cpu_percent",
            value=cpu.percent,
            detail=f"{cpu.count_logical} logical cores tracked",
        ),
        ServiceStatusItem(
            name="RAM Monitor",
            status=_classify_usage(memory.percent),
            metric="memory_percent",
            value=memory.percent,
            detail=f"{round(memory.used_bytes / (1024 ** 3), 2)} GB used of {round(memory.total_bytes / (1024 ** 3), 2)} GB",
        ),
        ServiceStatusItem(
            name="Disk Monitor",
            status=_classify_usage(disk.percent),
            metric="disk_percent",
            value=disk.percent,
            detail=f"{round(disk.free_bytes / (1024 ** 3), 2)} GB free",
        ),
        ServiceStatusItem(
            name="Process Monitor",
            status=ResourceStatus.HEALTHY if process_count < 500 else ResourceStatus.DEGRADED,
            metric="process_count",
            value=float(process_count),
            detail=f"Tracking {process_count} active processes",
        ),
    ]

    healthy = sum(1 for s in services if s.status == ResourceStatus.HEALTHY)
    return ServicesStatusResponse(
        timestamp=_utc_now(),
        services=services,
        healthy_count=healthy,
        total_count=len(services),
    )
