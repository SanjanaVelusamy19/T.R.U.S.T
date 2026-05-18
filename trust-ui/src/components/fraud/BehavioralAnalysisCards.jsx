import { Activity } from "lucide-react";

const statusColors = {
  NORMAL: "text-cyan-300 border-cyan-500/30",
  STABLE: "text-cyan-300 border-cyan-500/30",
  ALIGNED: "text-emerald-300 border-emerald-500/30",
  ELEVATED: "text-amber-300 border-amber-500/30",
  ANOMALY: "text-rose-300 border-rose-500/40",
  HIGH: "text-rose-300 border-rose-500/40",
  UNUSUAL: "text-fuchsia-300 border-fuchsia-500/40",
  VOLATILE: "text-amber-300 border-amber-500/40",
  DRIFT: "text-rose-300 border-rose-500/40",
  CRITICAL: "text-rose-200 border-rose-400/50",
};

export function BehavioralAnalysisCards({ patterns = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {patterns.map((pattern) => {
        const statusClass = statusColors[pattern.status] || statusColors.NORMAL;
        return (
          <article
            key={pattern.dimension}
            className="fraud-behavior-card insight-card rounded-xl border border-slate-700/60 bg-slate-900/40 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {pattern.dimension}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                  {Math.round(pattern.score)}
                </p>
              </div>
              <Activity className="h-5 w-5 text-cyan-400/70" aria-hidden />
            </div>
            <p className={`mt-2 inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusClass}`}>
              {pattern.status}
            </p>
            <p className="mt-2 text-xs text-slate-400">{pattern.detail}</p>
          </article>
        );
      })}
    </div>
  );
}
