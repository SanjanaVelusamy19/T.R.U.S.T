import { RefreshCw, Shield } from "lucide-react";

const outcomeStyle = {
  RESTORED: "text-emerald-300 border-emerald-500/30",
  ALERT: "text-rose-300 border-rose-500/35",
  IN_PROGRESS: "text-violet-300 border-violet-500/35",
};

export function SelfHealingActivity({ events = [], loading = false }) {
  if (loading) {
    return (
      <ul className="space-y-2">
        {[1, 2, 3].map((i) => (
          <li key={i} className="h-14 animate-pulse rounded-lg bg-slate-800/50" />
        ))}
      </ul>
    );
  }

  const list = [...events].reverse().slice(0, 12);

  if (!list.length) {
    return (
      <p className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-xs text-slate-500">
        No self-healing events recorded yet. Recovery actions appear when services flap or restore.
      </p>
    );
  }

  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
      {list.map((ev, idx) => {
        const oc = outcomeStyle[ev.outcome] || "text-slate-300 border-slate-600/40";
        return (
          <li
            key={`${ev.timestamp}-${ev.service}-${idx}`}
            className={`monitor-heal-event flex gap-3 rounded-lg border bg-slate-900/50 px-3 py-2 text-xs ${oc}`}
          >
            {ev.outcome === "RESTORED" ? (
              <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            )}
            <div>
              <p className="font-semibold text-white">{ev.service}</p>
              <p className="text-[10px] text-slate-500">{ev.timestamp}</p>
              <p className="mt-1 text-slate-300">{ev.detail}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                {ev.action} · {ev.outcome}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
