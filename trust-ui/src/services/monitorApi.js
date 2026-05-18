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
  return "Unable to load infrastructure monitoring from the gateway.";
}

async function get(path) {
  try {
    const { data } = await api.get(path);
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export function fetchMonitorSystemHealth() {
  return get("/api/monitor/system-health");
}

export function fetchMonitorServices() {
  return get("/api/monitor/services");
}

export function fetchMonitorAlerts() {
  return get("/api/monitor/alerts");
}

export function fetchMonitorLatency() {
  return get("/api/monitor/latency");
}

export function fetchMonitorHealthHistory() {
  return get("/api/monitor/health-history");
}
