import { Activity, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

const statusIcon = {
  HEALTHY: CheckCircle2,
  DEGRADED: AlertTriangle,
  DOWN: XCircle,
  RECOVERING: Loader2,
};

const statusClass = {
  HEALTHY: "border-emerald-500/35 text-emerald-300",
  DEGRADED: "border-amber-500/35 text-amber-300",
  DOWN: "border-rose-500/40 text-rose-300",
  RECOVERING: "border-violet-500/35 text-violet-300",
};

export function ServiceHealthCards({ services = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {services.map((svc) => {
        const Icon = statusIcon[svc.status] || Activity;
        const ring = statusClass[svc.status] || statusClass.HEALTHY;
        return (
          <article
            key={svc.key || svc.name}
            className={`monitor-service-card insight-card rounded-xl border bg-slate-900/40 p-4 ${ring}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {svc.name}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">{svc.status}</p>
              </div>
              <Icon
                className={`h-5 w-5 shrink-0 ${svc.status === "RECOVERING" ? "animate-spin" : ""}`}
                aria-hidden
              />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div>
                <dt className="text-slate-500">Latency</dt>
                <dd className="font-mono text-cyan-100/90">{Math.round(svc.latency_ms)} ms</dd>
              </div>
              <div>
                <dt className="text-slate-500">Uptime</dt>
                <dd className="font-mono text-slate-200">{Number(svc.uptime_percent).toFixed(1)}%</dd>
              </div>
            </dl>
            {svc.retries_used > 0 ? (
              <p className="mt-2 text-[10px] text-violet-300/90">
                Self-healing probes used: {svc.retries_used}
                {svc.recovered ? " · recovered" : ""}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
