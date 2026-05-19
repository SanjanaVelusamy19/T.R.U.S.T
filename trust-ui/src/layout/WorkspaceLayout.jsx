import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import { CommandPaletteProvider } from "../context/CommandPaletteContext.jsx";
import { NotificationProvider } from "../context/NotificationContext.jsx";
import { fetchMonitoringMetrics } from "../services/monitoringApi.js";
import { TrustBackground } from "../components/TrustBackground.jsx";
import { CommandPalette } from "./CommandPalette.jsx";
import { NotificationPanel } from "./NotificationPanel.jsx";
import { Sidebar } from "./Sidebar.jsx";
import { StatusDock } from "./StatusDock.jsx";
import { Topbar } from "./Topbar.jsx";
import { useEcosystemSignals } from "../hooks/useEcosystemSignals.js";

const SIDEBAR_KEY = "trust_sidebar_collapsed";

function WorkspaceInner() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === "1");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dockMetrics, setDockMetrics] = useState({ cpu: null, memory: null, gateway: "online" });

  useEcosystemSignals();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMonitoringMetrics();
        if (!cancelled) {
          setDockMetrics({
            cpu: data?.cpu_percent ?? data?.cpu?.percent,
            memory: data?.memory_percent ?? data?.memory?.percent,
            gateway: "online",
          });
        }
      } catch {
        if (!cancelled) setDockMetrics((m) => ({ ...m, gateway: "degraded" }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div className="command-center-root relative flex min-h-screen">
      <TrustBackground />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="relative z-10 flex min-h-screen min-w-0 flex-1 flex-col lg:ml-0">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          onNotificationsToggle={() => setNotificationsOpen((v) => !v)}
          notificationsOpen={notificationsOpen}
        />
        <main className="workspace-main flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
        <StatusDock metrics={dockMetrics} />
      </div>
      <CommandPalette />
      <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </motion.div>
  );
}

export function WorkspaceLayout() {
  return (
    <CommandPaletteProvider>
      <NotificationProvider>
        <WorkspaceInner />
      </NotificationProvider>
    </CommandPaletteProvider>
  );
}
