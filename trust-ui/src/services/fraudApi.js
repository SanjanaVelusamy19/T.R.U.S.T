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
    return "Fraud detection service is unavailable. Start fraud-detection-service on port 8005.";
  }
  return "Unable to load behavioral fraud intelligence from the gateway.";
}

async function get(path) {
  try {
    const { data } = await api.get(path);
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/** Full behavioral fraud analysis snapshot. */
export function fetchFraudAnalysis() {
  return get("/api/fraud/analysis");
}

export function fetchFraudAlerts() {
  return get("/api/fraud/alerts");
}

export function fetchFraudRiskScore() {
  return get("/api/fraud/risk-score");
}

export function fetchFraudBehaviorCheck() {
  return get("/api/fraud/behavior-check");
}
