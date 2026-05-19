import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Command,
  Menu,
  Search,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCommandPalette } from "../context/CommandPaletteContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { fetchMonitoringServicesStatus } from "../services/monitoringApi.js";
import { findNavByPath } from "./navConfig.js";
import { useLocation } from "react-router-dom";

function healthTone(score) {
  if (score >= 90) return { label: "Optimal", dot: "bg-emerald-400", text: "text-emerald-300" };
  if (score >= 70) return { label: "Stable", dot: "bg-cyan-400", text: "text-cyan-300" };
  if (score >= 50) return { label: "Degraded", dot: "bg-amber-400", text: "text-amber-300" };
  return { label: "Critical", dot: "bg-rose-500", text: "text-rose-300" };
}

export function Topbar({ onMenuClick, onNotificationsToggle, notificationsOpen }) {
  const { user, logout } = useAuth();
  const { toggle: togglePalette } = useCommandPalette();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const current = findNavByPath(location.pathname);
  const [health, setHealth] = useState({ score: 100, online: 0, total: 0 });
  const tone = healthTone(health.score);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await fetchMonitoringServicesStatus();
        const services = data?.services || data || [];
        const list = Array.isArray(services) ? services : Object.values(services);
        const total = list.length || 1;
        const online = list.filter(
          (s) => String(s?.status || s?.state || "").toUpperCase() === "UP" ||
            String(s?.status || "").toUpperCase() === "HEALTHY",
        ).length;
        const score = Math.round((online / total) * 100);
        if (!cancelled) setHealth({ score, online, total });
      } catch {
        if (!cancelled) setHealth({ score: 72, online: 0, total: 0 });
      }
    }

    poll();
    const id = setInterval(poll, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <header className="command-topbar relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-800/80 bg-slate-950/50 px-3 backdrop-blur-xl sm:px-4">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800/60 hover:text-white lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Link to="/dashboard" className="hidden items-center gap-2 sm:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500">
          <Shield className="h-4 w-4 text-slate-950" />
        </div>
        <div className="hidden md:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">TRUST</p>
          <p className="text-xs text-slate-400">Adaptive Fintech OS</p>
        </div>
      </Link>

      <motion.div
        className="hidden items-center gap-2 rounded-full border border-slate-800/80 bg-slate-900/50 px-3 py-1.5 lg:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className={`h-2 w-2 rounded-full ${tone.dot} trust-pulse`} />
        <span className={`text-xs font-medium ${tone.text}`}>{tone.label}</span>
        <span className="text-[10px] text-slate-500">
          {health.online}/{health.total || "—"} services
        </span>
      </motion.div>

      {current ? (
        <p className="hidden truncate text-sm text-slate-400 xl:block">
          <span className="text-slate-600">{current.module}</span>
          <span className="mx-2 text-slate-700">/</span>
          <span className="text-slate-200">{current.label}</span>
        </p>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={togglePalette}
          className="command-search hidden max-w-xs flex-1 items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 px-3 py-2 text-left text-xs text-slate-500 transition hover:border-cyan-500/30 hover:text-slate-300 sm:flex sm:min-w-[200px] lg:min-w-[280px]"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">Search ecosystem…</span>
          <kbd className="hidden rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:inline">
            Ctrl K
          </kbd>
        </button>

        <button
          type="button"
          onClick={togglePalette}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800/60 hover:text-cyan-300 sm:hidden"
          aria-label="Command palette"
        >
          <Command className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onNotificationsToggle}
          className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800/60 hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>

        <div className="hidden items-center gap-2 border-l border-slate-800/80 pl-2 sm:flex">
          <motion.div
            className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 ring-1 ring-cyan-500/30"
            whileHover={{ scale: 1.05 }}
          />
          <motion.div
            className="hidden text-right md:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="max-w-[140px] truncate text-xs font-medium text-slate-200">
              {user?.full_name}
            </p>
            <p className="max-w-[140px] truncate text-[10px] text-slate-500">{user?.email}</p>
          </motion.div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-800/60 hover:text-rose-300"
          >
            Exit
          </button>
        </div>
      </div>
    </header>
  );
}
