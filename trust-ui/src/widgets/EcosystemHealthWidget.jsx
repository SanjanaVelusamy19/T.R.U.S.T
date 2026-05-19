import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";
import { WidgetFrame } from "./WidgetFrame.jsx";

export function EcosystemHealthWidget({ systemStatus, services, loading, error }) {
  const overall = systemStatus?.status || systemStatus?.overall_status || "HEALTHY";
  const list = Array.isArray(services?.services)
    ? services.services
    : Array.isArray(services)
      ? services
      : [];
  const online = list.filter(
    (s) =>
      String(s?.status || "").toUpperCase() === "UP" ||
      String(s?.status || "").toUpperCase() === "HEALTHY",
  ).length;
  const total = list.length || 0;
  const pct = total ? Math.round((online / total) * 100) : 100;

  const tone =
    String(overall).toUpperCase() === "HEALTHY" || String(overall).toUpperCase() === "OK"
      ? "text-emerald-300"
      : "text-amber-300";

  return (
    <WidgetFrame
      title="Ecosystem Health"
      subtitle="Gateway & service mesh"
      icon={HeartPulse}
      loading={loading}
      error={error}
      href="/api-health"
      accent="cyan"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={`text-3xl font-bold tabular-nums ${tone}`}>{pct}%</p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Availability</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold uppercase ${tone}`}>{overall}</p>
          <p className="text-[10px] text-slate-500">
            {online}/{total || "—"} nodes
          </p>
        </div>
      </div>
      <motion.div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </motion.div>
    </WidgetFrame>
  );
}
