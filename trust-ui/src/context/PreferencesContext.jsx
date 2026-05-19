import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "trust_preferences";

const DEFAULT_PREFS = {
  theme: "futuristic",
  neonAccent: true,
  environment: "production",
  notifications: {
    fraud: true,
    monitoring: true,
    advisor: true,
    trust: true,
  },
};

const PreferencesContext = createContext(null);

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw), notifications: { ...DEFAULT_PREFS.notifications, ...JSON.parse(raw).notifications } };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(readStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    const root = document.documentElement;
    root.dataset.trustTheme = prefs.theme;
    root.dataset.trustNeon = prefs.neonAccent ? "on" : "off";
  }, [prefs]);

  const updatePrefs = useCallback((patch) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }, []);

  const setNotification = useCallback((key, enabled) => {
    setPrefs((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: enabled },
    }));
  }, []);

  const value = useMemo(
    () => ({ prefs, updatePrefs, setNotification }),
    [prefs, updatePrefs, setNotification],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
