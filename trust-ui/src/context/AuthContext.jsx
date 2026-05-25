import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "../services/api.js";

const AuthContext = createContext(null);


// =========================================================
// READ STORED USER
// =========================================================

function readStoredUser() {
  try {
    const raw = localStorage.getItem("trust_user");

    return raw ? JSON.parse(raw) : null;

  } catch {
    return null;
  }
}


// =========================================================
// AUTH PROVIDER
// =========================================================

export function AuthProvider({ children }) {

  const [token, setToken] = useState(
    () => localStorage.getItem("trust_token")
  );

  const [user, setUser] = useState(
    () => readStoredUser()
  );

  const [bootstrapping, setBootstrapping] = useState(
    Boolean(localStorage.getItem("trust_token"))
  );


  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = useCallback(() => {

    localStorage.removeItem("trust_token");
    localStorage.removeItem("trust_user");

    setToken(null);
    setUser(null);

  }, []);


  // =========================================================
  // LOGIN
  // =========================================================

  const loginWithToken = useCallback(
    (accessToken, profile) => {

      localStorage.setItem(
        "trust_token",
        accessToken
      );

      localStorage.setItem(
        "trust_user",
        JSON.stringify(profile)
      );

      setToken(accessToken);
      setUser(profile);

    },
    [],
  );


  // =========================================================
  // VERIFY TOKEN ON REFRESH
  // =========================================================

  useEffect(() => {

    if (!token) {
      setBootstrapping(false);
      return;
    }

    let cancelled = false;

    (async () => {

      try {

        // IMPORTANT FIX:
        // Send Authorization header

        await api.get(
          "/api/auth/verify-token",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

      } catch (err) {

        if (!cancelled) {
          if (err.response && err.response.status === 401) {
            logout();
          }
        }

      } finally {

        if (!cancelled) {
          setBootstrapping(false);
        }
      }

    })();

    return () => {
      cancelled = true;
    };

  }, [token, logout]);


  // =========================================================
  // CONTEXT VALUE
  // =========================================================

  const value = useMemo(
    () => ({
      token,
      user,
      bootstrapping,

      isAuthenticated: Boolean(
        token && user
      ),

      loginWithToken,
      logout,
    }),

    [
      token,
      user,
      bootstrapping,
      loginWithToken,
      logout,
    ],
  );


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


// =========================================================
// HOOK
// =========================================================

export function useAuth() {

  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}