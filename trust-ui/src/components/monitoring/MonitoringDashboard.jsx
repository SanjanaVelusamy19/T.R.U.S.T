import { GlassCard } from "../GlassCard.jsx";
import { LoadingSpinner } from "../LoadingSpinner.jsx";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[index]}`;
}

function statusTone(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "CRITICAL") {
    return {
      badge: "border-rose-500/40 bg-rose-500/10 text-rose-200",
      bar: "from-rose-500 to-orange-500",
    };
  }
  if (normalized === "DEGRADED") {
    return {
      badge: "border-amber-500/40 bg-amber-500/10 text-amber-200",
      bar: "from-amber-400 to-orange-400",
    };
  }
  return {
    badge: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
    bar: "from-cyan-400 to-fuchsia-500",
  };
}

function StatusBadge({ status }) {
  const tone = statusTone(status);
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tone.badge}`}
    >
      {status}
    </span>
  );
}

function UsageMeter({ label, percent, detail, status }) {
  const tone = statusTone(status);
  const clamped = Math.min(100, Math.max(0, Number(percent) || 0));

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-white">{clamped.toFixed(1)}%</span>
          {status ? <StatusBadge status={status} /> : null}
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone.bar} shadow-[0_0_16px_rgba(34,211,238,0.35)] transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {detail ? <p className="mt-2 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
}

export function MonitoringDashboard({ metrics, systemStatus, servicesStatus, loading, error }) {
  if (loading) {
    return (
      <GlassCard>
        <LoadingSpinner label="Collecting system metrics…" />
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard>
        <p className="text-sm text-rose-300">{error}</p>
      </GlassCard>
    );
  }

  const memory = metrics?.memory;
  const disk = metrics?.disk;
  const services = servicesStatus?.services ?? [];

  return (
    <div className="space-y-6">
      {systemStatus ? (
        <GlassCard>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
                System health
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">Platform status</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">{systemStatus.summary}</p>
            </div>
            <StatusBadge status={systemStatus.status} />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 px-4 py-3">
              <p className="text-xs text-slate-500">Processes</p>
              <p className="mt-1 text-2xl font-semibold text-white">{systemStatus.process_count}</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 px-4 py-3">
              <p className="text-xs text-slate-500">Last updated</p>
              <p className="mt-1 text-sm font-medium text-slate-200">{systemStatus.timestamp}</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 px-4 py-3">
              <p className="text-xs text-slate-500">Healthy services</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {servicesStatus?.healthy_count ?? 0}
                <span className="text-base font-normal text-slate-500">
                  {" "}
                  / {servicesStatus?.total_count ?? services.length}
                </span>
              </p>
            </div>
          </div>
        </GlassCard>
      ) : null}

      {metrics ? (
        <GlassCard>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300/80">
            Resource utilization
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">CPU, memory & disk</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <UsageMeter
              label="CPU usage"
              percent={metrics.cpu?.percent ?? systemStatus?.cpu_percent}
              status={systemStatus?.status}
              detail={`${metrics.cpu?.count_logical ?? 0} logical cores`}
            />
            <UsageMeter
              label="RAM usage"
              percent={metrics.memory?.percent ?? systemStatus?.memory_percent}
              status={systemStatus?.status}
              detail={
                memory
                  ? `${formatBytes(memory.used_bytes)} / ${formatBytes(memory.total_bytes)}`
                  : null
              }
            />
            <UsageMeter
              label="Disk usage"
              percent={metrics.disk?.percent ?? systemStatus?.disk_percent}
              status={systemStatus?.status}
              detail={
                disk ? `${formatBytes(disk.used_bytes)} / ${formatBytes(disk.total_bytes)}` : null
              }
            />
          </div>
        </GlassCard>
      ) : null}

      {services.length > 0 ? (
        <GlassCard>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
            Running services
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">Monitored domains</h2>
          <ul className="mt-6 space-y-3">
            {services.map((service) => (
              <li
                key={service.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/30 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-100">{service.name}</p>
                  <p className="text-xs text-slate-500">{service.detail}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-right">
                  <p className="text-sm text-slate-300">
                    {service.metric}: {Number(service.value).toFixed(1)}%
                  </p>
                  <StatusBadge status={service.status} />
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}
    </div>
  );
}
