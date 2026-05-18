import { api } from "./api.js";

function extractErrorMessage(error) {
  const payload = error.response?.data;
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.detail === "string") return payload.detail;
  if (error.response?.status === 401) {
    return "Session expired. Please sign in again.";
  }
  if (error.response?.status === 503) {
    return "Gold loan service is unavailable. Start gold-loan-service on port 8008.";
  }
  return "Unable to load gold loan intelligence from the gateway.";
}

async function get(path) {
  try {
    const { data } = await api.get(path);
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

async function post(path, body) {
  try {
    const { data } = await api.post(path, body);
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export function evaluateGoldLoan(payload) {
  return post("/api/gold-loan/evaluate", payload);
}

export function fetchGoldLoanRiskAnalysis(params = {}) {
  const qs = new URLSearchParams();
  if (params.gold_weight_grams != null) qs.set("gold_weight_grams", String(params.gold_weight_grams));
  if (params.purity) qs.set("purity", params.purity);
  const query = qs.toString();
  return get(`/api/gold-loan/risk-analysis${query ? `?${query}` : ""}`);
}

export function fetchGoldLoanInterestRates() {
  return get("/api/gold-loan/interest-rates");
}

export function fetchGoldLoanRecommendations(params = {}) {
  const qs = new URLSearchParams();
  if (params.gold_weight_grams != null) qs.set("gold_weight_grams", String(params.gold_weight_grams));
  if (params.purity) qs.set("purity", params.purity);
  const query = qs.toString();
  return get(`/api/gold-loan/recommendations${query ? `?${query}` : ""}`);
}
