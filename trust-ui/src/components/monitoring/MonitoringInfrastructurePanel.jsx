import { Cpu, HeartPulse } from "lucide-react";
import { GlassCard } from "../GlassCard.jsx";
import { HealthTimelineChart } from "./HealthTimelineChart.jsx";
import { LatencyChart } from "./LatencyChart.jsx";
import { MonitorAlertFeed } from "./MonitorAlertFeed.jsx";
import { SelfHealingActivity } from "./SelfHealingActivity.jsx";
import { ServiceHealthCards } from "./ServiceHealthCards.jsx";
import { SystemStatusPanel } from "./SystemStatusPanel.jsx";

export function MonitoringInfrastructurePanel({ data, loading = false, error = "" }) {
  const services = data?.services ?? [];
  const alerts = data?.alerts ?? [];
  const adaptive = data?.adaptive_alerts ?? [];
  const metrics = data?.latency_metrics ?? [];
  const history = data?.health_history ?? [];
  const healing = data?.self_healing_events ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300/80">
            Observability & resilience
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
            <HeartPulse className="h-6 w-6 text-sky-400" />
            Self-healing monitoring
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Live health probes, latency baselines, adaptive alerts, and simulated recovery
            telemetry — exposed only through the API gateway with JWT.
          </p>
        </div>
        <span className="monitor-badge inline-flex items-center gap-2 self-start rounded-full border border-sky-500/35 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200">
          <Cpu className="h-3.5 w-3.5" />
          Deterministic probes
        </span>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <GlassCard className="monitor-panel-glow">
        <SystemStatusPanel
          systemStatus={data?.system_status ?? "HEALTHY"}
          activeServices={data?.active_services ?? 0}
          healthyServices={data?.healthy_services ?? 0}
          gatewayLatency={data?.gateway_latency_ms ?? 0}
          failedRequests={data?.failed_requests ?? 0}
          loading={loading}
        />
      </GlassCard>

      <GlassCard className="monitor-panel-glow">
        <header className="mb-4">
          <h3 className="text-sm font-semibold text-white">Service health</h3>
          <p className="text-xs text-slate-500">Per-microservice status & latency</p>
        </header>
        <ServiceHealthCards services={services} loading={loading} />
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="monitor-panel-glow">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">API latency</h3>
            <p className="text-xs text-slate-500">Observed vs rolling baseline</p>
          </header>
          <LatencyChart metrics={metrics} loading={loading} />
        </GlassCard>

        <GlassCard className="monitor-panel-glow">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">Alert feed</h3>
            <p className="text-xs text-slate-500">Infrastructure & adaptive signals</p>
          </header>
          <MonitorAlertFeed alerts={alerts} adaptive={adaptive} loading={loading} />
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="monitor-panel-glow">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">Health timeline</h3>
            <p className="text-xs text-slate-500">Healthy count & average latency over checks</p>
          </header>
          <HealthTimelineChart history={history} loading={loading} />
        </GlassCard>

        <GlassCard className="monitor-panel-glow">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">Self-healing activity</h3>
            <p className="text-xs text-slate-500">Recovery & probe events</p>
          </header>
          <SelfHealingActivity events={healing} loading={loading} />
        </GlassCard>
      </div>
    </section>
  );
}
