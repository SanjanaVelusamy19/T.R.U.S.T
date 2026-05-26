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
    return "Advisor service is unavailable. Start advisor-service on port 8004.";
  }
  return "Unable to load financial advisor insights from the gateway.";
}

async function get(path) {
  try {
    const { data } = await api.get(path);
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/** Full advisory snapshot for the intelligence panel. */
export function fetchAdvisorSummary() {
  return get("/api/advisor/summary");
}

export function fetchAdvisorRecommendations() {
  return get("/api/advisor/recommendations");
}

export function fetchAdvisorRiskAnalysis() {
  return get("/api/advisor/risk-analysis");
}

export function fetchAdvisorFinancialHealth() {
  return get("/api/advisor/financial-health");
}
