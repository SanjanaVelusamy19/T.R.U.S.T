import { createContext, useCallback, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);

let idCounter = 0;

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((notification) => {
    const id = ++idCounter;
    const entry = {
      id,
      read: false,
      createdAt: Date.now(),
      ...notification,
    };
    setItems((prev) => [entry, ...prev].slice(0, 50));
    return id;
  }, []);

  const markRead = useCallback((id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const value = useMemo(
    () => ({ items, push, markRead, markAllRead, unreadCount }),
    [items, push, markRead, markAllRead, unreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
