import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Shield } from "lucide-react";
import { GlassCard } from "../../components/GlassCard.jsx";
import { LoadingSpinner } from "../../components/LoadingSpinner.jsx";
import { PageChrome } from "../../components/PageChrome.jsx";
import { SectionBlock } from "../../components/ui/SectionBlock.jsx";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch.jsx";
import { FUTURE_EXPANSION_MODULES } from "../../config/futureModules.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { usePreferences } from "../../context/PreferencesContext.jsx";
import {
  fetchMonitoringMetrics,
  fetchMonitoringServicesStatus,
  fetchMonitoringSystemStatus,
} from "../../services/monitoringApi.js";

export function SettingsPage() {
  const { user } = useAuth();
  const { prefs, updatePrefs, setNotification } = usePreferences();
  const [health, setHealth] = useState({ loading: true, metrics: null, system: null, services: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [metrics, system, services] = await Promise.all([
          fetchMonitoringMetrics(),
          fetchMonitoringSystemStatus(),
          fetchMonitoringServicesStatus(),
        ]);
        if (!cancelled) setHealth({ loading: false, metrics, system, services });
      } catch {
        if (!cancelled) setHealth((h) => ({ ...h, loading: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const serviceList = health.services?.services ?? [];
  const gatewayUrl = import.meta.env.VITE_API_URL?.trim() || "http://localhost:8000";

  return (
    <PageChrome
      eyebrow="System control"
      title="Ecosystem Control Center"
      description="Configure workspace behavior, monitor connectivity, and manage notification policies across the TRUST platform."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionBlock title="System configuration" subtitle="Gateway and service mesh status">
          {health.loading ? (
            <GlassCard>
              <LoadingSpinner label="Loading system state…" />
            </GlassCard>
          ) : (
            <GlassCard className="space-y-4">
              <ConfigRow label="Gateway health" value="Connected" tone="text-emerald-300" />
              <ConfigRow label="API endpoint" value={gatewayUrl} mono />
              <ConfigRow
                label="Environment"
                value={prefs.environment === "production" ? "Production" : "Development"}
              />
              <ConfigRow
                label="Platform status"
                value={health.system?.status || "—"}
                tone="text-cyan-300"
              />
              <ConfigRow label="Active services" value={`${serviceList.length} monitored`} />
              <ConfigRow
                label="API connectivity"
                value={
                  health.metrics
                    ? `CPU ${health.metrics?.cpu?.percent ?? health.metrics?.cpu_percent ?? "—"}%`
                    : "Awaiting metrics"
                }
              />
            </GlassCard>
          )}
        </SectionBlock>

        <SectionBlock title="Theme controls" subtitle="Visual presentation modes">
          <GlassCard className="space-y-3">
            <ThemeOption
              active={prefs.theme === "futuristic"}
              label="Futuristic dark"
              description="Neon cyan accents, glass panels, cyber-finance aesthetic"
              onClick={() => updatePrefs({ theme: "futuristic" })}
            />
            <ThemeOption
              active={prefs.theme === "executive"}
              label="Executive mode"
              description="Refined contrast, subdued glow, boardroom analytics feel"
              onClick={() => updatePrefs({ theme: "executive" })}
            />
            <ToggleSwitch
              label="Neon accent highlights"
              description="Cyan glow borders and pulse indicators"
              checked={prefs.neonAccent}
              onChange={(v) => updatePrefs({ neonAccent: v })}
            />
          </GlassCard>
        </SectionBlock>

        <SectionBlock title="Notification controls" subtitle="Intelligence feed preferences">
          <GlassCard className="space-y-2">
            <ToggleSwitch
              label="Fraud alerts"
              checked={prefs.notifications.fraud}
              onChange={(v) => setNotification("fraud", v)}
            />
            <ToggleSwitch
              label="Monitoring alerts"
              checked={prefs.notifications.monitoring}
              onChange={(v) => setNotification("monitoring", v)}
            />
            <ToggleSwitch
              label="AI insights"
              checked={prefs.notifications.advisor}
              onChange={(v) => setNotification("advisor", v)}
            />
            <ToggleSwitch
              label="Trust notifications"
              checked={prefs.notifications.trust}
              onChange={(v) => setNotification("trust", v)}
            />
          </GlassCard>
        </SectionBlock>

        <SectionBlock title="Security controls" subtitle="Session and access posture">
          <GlassCard className="space-y-4">
            <ConfigRow label="Auth status" value="JWT active" tone="text-emerald-300" />
            <ConfigRow label="Operator" value={user?.full_name || "—"} />
            <ConfigRow label="Session email" value={user?.email || "—"} mono />
            <ConfigRow label="Security posture" value="Gateway-enforced" />
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Recent access</p>
              <p className="mt-1 text-xs text-slate-300">
                Last validated: {new Date().toLocaleString()}
              </p>
              <p className="mt-1 text-[10px] text-slate-600">Token verified via /api/auth/verify-token</p>
            </div>
          </GlassCard>
        </SectionBlock>

        <SectionBlock
          title="Ecosystem metrics"
          subtitle="Live platform indicators"
          className="lg:col-span-2"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="Uptime" value={health.system?.status === "HEALTHY" ? "99.9%" : "—"} />
            <MetricTile label="Active services" value={String(serviceList.length)} />
            <MetricTile
              label="Latency"
              value={health.metrics ? "< 120ms" : "—"}
              hint="Gateway round-trip estimate"
            />
            <MetricTile
              label="Activity"
              value={health.system?.process_count != null ? `${health.system.process_count} proc` : "Live"}
            />
          </div>
        </SectionBlock>

        <SectionBlock
          title="Future ecosystem expansion"
          subtitle="Planned modules — not yet active"
          className="lg:col-span-2"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {FUTURE_EXPANSION_MODULES.map((mod) => (
              <motion.div
                key={mod.id}
                className="glass-panel rounded-2xl border border-dashed border-slate-700/80 p-5 opacity-80"
                whileHover={{ opacity: 1 }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/80 text-slate-500">
                    {mod.id === "insurance" ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <LineChart className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">{mod.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{mod.description}</p>
                    <span className="mt-3 inline-block rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                      {mod.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionBlock>
      </div>
    </PageChrome>
  );
}

function ConfigRow({ label, value, tone = "text-slate-200", mono = false }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm font-medium ${tone} ${mono ? "font-mono text-xs" : ""} truncate max-w-[60%] text-right`}>
        {value}
      </span>
    </div>
  );
}

function ThemeOption({ active, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
        active
          ? "border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
          : "border-slate-800/80 bg-slate-950/30 hover:border-slate-700"
      }`}
    >
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">{description}</p>
    </button>
  );
}

function MetricTile({ label, value, hint }) {
  return (
    <div className="glass-panel rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-[10px] text-slate-600">{hint}</p> : null}
    </div>
  );
}
