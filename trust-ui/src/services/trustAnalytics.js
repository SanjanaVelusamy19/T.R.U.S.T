import { api } from "./api.js";

function extractErrorMessage(error) {
  const payload = error.response?.data;
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.detail === "string") return payload.detail;
  if (error.response?.status === 401) {
    return "Session expired. Please sign in again.";
  }
  if (error.response?.status === 503) {
    return "Trust score service is unavailable. Start trust-score-service on port 8003.";
  }
  return "Unable to load trust analytics from the gateway.";
}

/**
 * Fetch visualization-ready dashboard snapshot (gateway → trust service).
 */
export async function fetchTrustDashboard() {
  try {
    const { data } = await api.get("/api/trust/analytics/dashboard");
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Fetch trust score timeline series.
 */
export async function fetchTrustTimeline() {
  try {
    const { data } = await api.get("/api/trust/analytics/timeline");
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
