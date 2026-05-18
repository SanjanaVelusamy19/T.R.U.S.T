import { Bell, Sparkles } from "lucide-react";

export function MonitorAlertFeed({ alerts = [], adaptive = [], loading = false }) {
  if (loading) {
    return (
      <ul className="space-y-2">
        {[1, 2, 3].map((i) => (
          <li key={i} className="h-10 animate-pulse rounded-lg bg-slate-800/50" />
        ))}
      </ul>
    );
  }

  const combined = [
    ...alerts.map((text) => ({ text, type: "alert" })),
    ...adaptive.map((text) => ({ text, type: "adaptive" })),
  ];

  if (!combined.length) {
    return (
      <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-100/90">
        No active infrastructure alerts.
      </p>
    );
  }

  return (
    <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
      {combined.map((item) => (
        <li
          key={`${item.type}-${item.text}`}
          className={
            item.type === "alert"
              ? "monitor-infra-alert flex gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-50"
              : "flex gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-100"
          }
        >
          {item.type === "alert" ? (
            <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />
          ) : (
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden />
          )}
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
