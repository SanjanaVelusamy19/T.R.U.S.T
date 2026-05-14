import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("trust_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("trust_token"));
  const [user, setUser] = useState(() => readStoredUser());
  const [bootstrapping, setBootstrapping] = useState(Boolean(localStorage.getItem("trust_token")));

  const logout = useCallback(() => {
    localStorage.removeItem("trust_token");
    localStorage.removeItem("trust_user");
    setToken(null);
    setUser(null);
  }, []);

  const loginWithToken = useCallback((accessToken, profile) => {
    localStorage.setItem("trust_token", accessToken);
    localStorage.setItem("trust_user", JSON.stringify(profile));
    setToken(accessToken);
    setUser(profile);
  }, []);

  useEffect(() => {
    if (!token) {
      setBootstrapping(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await api.get("/api/auth/verify-token");
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const value = useMemo(
    () => ({
      token,
      user,
      bootstrapping,
      isAuthenticated: Boolean(token && user),
      loginWithToken,
      logout,
    }),
    [token, user, bootstrapping, loginWithToken, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
