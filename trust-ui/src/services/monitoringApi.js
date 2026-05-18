import { api } from "./api.js";

function extractErrorMessage(error) {
  const payload = error.response?.data;
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.detail === "string") return payload.detail;
  if (error.response?.status === 401) {
    return "Session expired. Please sign in again.";
  }
  if (error.response?.status === 503) {
    return "Monitoring service is unavailable. Start monitoring-service on port 8006.";
  }
  return "Unable to load system monitoring data from the gateway.";
}

async function get(path) {
  try {
    const { data } = await api.get(path);
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export function fetchMonitoringMetrics() {
  return get("/api/monitoring/metrics");
}

export function fetchMonitoringSystemStatus() {
  return get("/api/monitoring/system-status");
}

export function fetchMonitoringServicesStatus() {
  return get("/api/monitoring/services-status");
}
