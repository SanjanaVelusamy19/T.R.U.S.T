import { AlertTriangle } from "lucide-react";

export function SecurityAlertPanel({ alerts = [], loading = false }) {
  if (loading) {
    return (
      <ul className="space-y-2">
        {[1, 2, 3].map((i) => (
          <li key={i} className="h-12 animate-pulse rounded-lg bg-slate-800/50" />
        ))}
      </ul>
    );
  }

  if (!alerts.length) {
    return (
      <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
        No active security alerts — behavioral baseline within tolerance.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert) => (
        <li
          key={alert}
          className="fraud-security-alert flex gap-3 rounded-lg border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-50 shadow-[0_0_20px_rgba(244,63,94,0.12)]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden />
          <span>{alert}</span>
        </li>
      ))}
    </ul>
  );
}
