import { api } from "./api.js";

function extractErrorMessage(error) {
  const payload = error.response?.data;
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.detail === "string") return payload.detail;
  if (typeof payload?.error === "string") return payload.error;
  if (error.response?.status === 401) {
    return "Session expired. Please sign in again.";
  }
  if (error.response?.status === 502) {
    return payload?.detail || "Upstream service unreachable. Check Render service URLs.";
  }
  if (error.response?.status === 503) {
    return "Digital twin service is unavailable. Start digital-twin-service on port 8007.";
  }
  return "Unable to load financial digital twin from the gateway.";
}

async function get(path) {
  try {
    const { data } = await api.get(path);
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export function fetchTwinForecast(scenario) {
  const qs = scenario ? `?scenario=${encodeURIComponent(scenario)}` : "";
  return get(`/api/twin/forecast${qs}`);
}

export function fetchTwinTrustProjection() {
  return get("/api/twin/trust-projection");
}

export function fetchTwinRiskSimulation() {
  return get("/api/twin/risk-simulation");
}

export function fetchTwinSavingsGrowth() {
  return get("/api/twin/savings-growth");
}

export function fetchTwinScenarios() {
  return get("/api/twin/scenarios");
}
