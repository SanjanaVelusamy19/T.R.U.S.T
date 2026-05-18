"""Pydantic schemas for system monitoring responses."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class ResourceStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    CRITICAL = "CRITICAL"


class CPUMetrics(BaseModel):
    percent: float = Field(..., ge=0, le=100)
    count_logical: int
    count_physical: int
    per_cpu_percent: list[float]


class MemoryMetrics(BaseModel):
    total_bytes: int
    available_bytes: int
    used_bytes: int
    percent: float = Field(..., ge=0, le=100)


class DiskMetrics(BaseModel):
    total_bytes: int
    used_bytes: int
    free_bytes: int
    percent: float = Field(..., ge=0, le=100)


class ProcessStats(BaseModel):
    pid: int
    name: str
    cpu_percent: float
    memory_percent: float
    status: str


class MetricsResponse(BaseModel):
    success: bool = True
    timestamp: str
    cpu: CPUMetrics
    memory: MemoryMetrics
    disk: DiskMetrics
    process_count: int
    top_processes: list[ProcessStats]


class SystemStatusResponse(BaseModel):
    success: bool = True
    timestamp: str
    status: ResourceStatus
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    process_count: int
    summary: str


class ServiceStatusItem(BaseModel):
    name: str
    status: ResourceStatus
    metric: str
    value: float
    detail: str


class ServicesStatusResponse(BaseModel):
    success: bool = True
    timestamp: str
    services: list[ServiceStatusItem]
    healthy_count: int
    total_count: int
