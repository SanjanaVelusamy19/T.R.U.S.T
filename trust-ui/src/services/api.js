import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:8000";

/** Read persisted JWT (supports legacy and current storage keys). */
export function getStoredToken() {
  return localStorage.getItem("trust_token") || localStorage.getItem("token");
}

/** Persist JWT for all API clients. */
export function storeToken(accessToken) {
  if (!accessToken) return;
  localStorage.setItem("trust_token", accessToken);
  localStorage.setItem("token", accessToken);
}

/** Clear persisted auth. */
export function clearStoredAuth() {
  localStorage.removeItem("trust_token");
  localStorage.removeItem("token");
  localStorage.removeItem("trust_user");
}

/**
 * Axios instance for TRUST UI — all traffic targets the API Gateway only.
 */
export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
  validateStatus: (status) => status >= 200 && status < 300,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  console.debug(
    "[TRUST API]",
    config.method?.toUpperCase(),
    config.baseURL,
    config.url,
    "token:",
    token ? "present" : "missing",
  );
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    const data = res.data;
    if (data !== null && typeof data === "object") {
      return res;
    }
    return Promise.reject(
      new Error("Server returned a non-JSON response. Check gateway and service URLs."),
    );
  },
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (data && typeof data !== "object") {
      error.message = "Unexpected server response format.";
    }

    if (status === 401) {
      clearStoredAuth();
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  },
);

/** Extract a user-facing message from gateway/auth error payloads. */
export function getApiErrorMessage(error, fallback = "Request failed.") {
  const data = error?.response?.data;
  if (!data) {
    return error?.message || fallback;
  }
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
  }
  return fallback;
}
