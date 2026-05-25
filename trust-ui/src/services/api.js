import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:8000";

/**
 * Axios instance for TRUST UI — all traffic targets the API Gateway only.
 */
export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("trust_token");
  console.debug(
    "[TRUST API]",
    config.method?.toUpperCase(),
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
  (res) => res,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem("trust_token");
      localStorage.removeItem("trust_user");
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  },
);
