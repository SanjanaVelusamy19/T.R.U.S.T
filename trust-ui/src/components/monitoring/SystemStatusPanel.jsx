import { Activity, Server } from "lucide-react";

const statusStyles = {
  HEALTHY: {
    label: "All systems operational",
    ring: "monitor-glow-healthy",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  DEGRADED: {
    label: "Degraded performance",
    ring: "monitor-glow-warn",
    text: "text-amber-300",
    dot: "bg-amber-400",
  },
  CRITICAL: {
    label: "Critical infrastructure alert",
    ring: "monitor-glow-critical",
    text: "text-rose-300",
    dot: "bg-rose-400",
  },
};

export function SystemStatusPanel({
  systemStatus = "HEALTHY",
  activeServices = 0,
  healthyServices = 0,
  gatewayLatency = 0,
  failedRequests = 0,
  loading = false,
}) {
  const palette = statusStyles[systemStatus] || statusStyles.HEALTHY;

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/50 ${palette.ring}`}
        >
          <Server className={`h-7 w-7 ${palette.text}`} aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Ecosystem status
          </p>
          {loading ? (
            <div className="mt-2 h-8 w-40 animate-pulse rounded bg-slate-800/60" />
          ) : (
            <>
              <p className={`mt-1 text-2xl font-semibold ${palette.text}`}>{systemStatus}</p>
              <p className="text-xs text-slate-400">{palette.label}</p>
            </>
          )}
        </div>
        {!loading && (
          <span className={`monitor-status-pulse ml-2 h-3 w-3 rounded-full ${palette.dot}`} />
        )}
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-slate-500">Services</dt>
          <dd className="mt-1 font-semibold text-white tabular-nums">
            {loading ? "—" : `${healthyServices}/${activeServices}`}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-slate-500">Gateway</dt>
          <dd className="mt-1 font-semibold text-cyan-200 tabular-nums">
            {loading ? "—" : `${Math.round(gatewayLatency)}ms`}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-slate-500">Failed probes</dt>
          <dd className="mt-1 font-semibold text-rose-200 tabular-nums">
            {loading ? "—" : failedRequests}
          </dd>
        </div>
        <div className="flex items-end gap-1">
          <Activity className="mb-0.5 h-4 w-4 text-violet-300" aria-hidden />
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">Self-heal</dt>
            <dd className="mt-1 text-xs font-medium text-violet-200">Active</dd>
          </div>
        </div>
      </dl>
    </div>
  );
}
