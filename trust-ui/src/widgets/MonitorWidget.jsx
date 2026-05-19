import { Activity } from "lucide-react";
import { WidgetFrame } from "./WidgetFrame.jsx";

export function MonitorWidget({ metrics, services, loading, error }) {
  const cpu = metrics?.cpu_percent ?? metrics?.cpu?.percent;
  const mem = metrics?.memory_percent ?? metrics?.memory?.percent;
  const serviceList = Array.isArray(services?.services)
    ? services.services
    : Array.isArray(services)
      ? services
      : [];

  return (
    <WidgetFrame
      title="Ecosystem Monitor"
      subtitle="Real-time infrastructure"
      icon={Activity}
      loading={loading}
      error={error}
      href="/monitoring"
      accent="cyan"
    >
      <div className="grid grid-cols-2 gap-3">
        <MetricPill label="CPU" value={cpu} suffix="%" />
        <MetricPill label="Memory" value={mem} suffix="%" />
      </div>
      <ul className="mt-4 max-h-28 space-y-1.5 overflow-y-auto">
        {serviceList.slice(0, 5).map((svc) => {
          const name = svc?.name || svc?.service || "Service";
          const up =
            String(svc?.status || "").toUpperCase() === "UP" ||
            String(svc?.status || "").toUpperCase() === "HEALTHY";
          return (
            <li
              key={name}
              className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950/40 px-2.5 py-1.5 text-[11px]"
            >
              <span className="text-slate-300">{name}</span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${up ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-rose-500"}`}
              />
            </li>
          );
        })}
        {serviceList.length === 0 && !loading ? (
          <li className="text-[11px] text-slate-500">Service mesh syncing…</li>
        ) : null}
      </ul>
    </WidgetFrame>
  );
}

function MetricPill({ label, value, suffix }) {
  const display = value != null ? `${Number(value).toFixed(1)}${suffix}` : "—";
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-white">{display}</p>
    </div>
  );
}
