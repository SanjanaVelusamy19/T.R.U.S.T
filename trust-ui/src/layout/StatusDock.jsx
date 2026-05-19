import { motion } from "framer-motion";
import { Activity, AlertTriangle, Brain } from "lucide-react";
import { useNotifications } from "../context/NotificationContext.jsx";

export function StatusDock({ metrics = {} }) {
  const { items } = useNotifications();
  const latestAlert = items.find((n) => n.tone === "alert" || n.tone === "warning");
  const latestInsight = items.find((n) => n.source === "advisor");

  return (
    <footer className="status-dock shrink-0 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-xl">
      <div className="grid gap-px md:grid-cols-3">
        <DockSection icon={AlertTriangle} label="Alerts" accent="rose">
          {latestAlert ? (
            <p className="truncate text-[11px] text-slate-300">{latestAlert.title}</p>
          ) : (
            <p className="text-[11px] text-slate-500">No active alerts</p>
          )}
        </DockSection>
        <DockSection icon={Activity} label="Metrics" accent="cyan">
          <p className="truncate text-[11px] text-slate-300">
            CPU {metrics.cpu ?? "—"}% · MEM {metrics.memory ?? "—"}% · Gateway{" "}
            <span className="text-emerald-400">{metrics.gateway ?? "online"}</span>
          </p>
        </DockSection>
        <DockSection icon={Brain} label="AI Insights" accent="violet">
          {latestInsight ? (
            <p className="truncate text-[11px] text-slate-300">{latestInsight.message}</p>
          ) : (
            <p className="text-[11px] text-slate-500">Advisor standing by</p>
          )}
        </DockSection>
      </div>
    </footer>
  );
}

function DockSection({ icon: Icon, label, accent, children }) {
  const accentClass =
    accent === "rose"
      ? "text-rose-400"
      : accent === "violet"
        ? "text-violet-400"
        : "text-cyan-400";

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-2.5"
      whileHover={{ backgroundColor: "rgba(15,23,42,0.5)" }}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${accentClass}`} />
      <motion.div className="min-w-0 flex-1" initial={{ opacity: 0.9 }} animate={{ opacity: 1 }}>
        <p className={`text-[10px] font-semibold uppercase tracking-wider ${accentClass}`}>{label}</p>
        {children}
      </motion.div>
    </motion.div>
  );
}
