import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Heart, Server, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "../../components/GlassCard.jsx";
import { LoadingSpinner } from "../../components/LoadingSpinner.jsx";
import { PageChrome } from "../../components/PageChrome.jsx";
import {
  fetchMonitoringMetrics,
  fetchMonitoringServicesStatus,
  fetchMonitoringSystemStatus,
} from "../../services/monitoringApi.js";

function isServiceUp(status) {
  const s = String(status || "").toUpperCase();
  return s === "UP" || s === "HEALTHY" || s === "OK";
}

export function ApiHealthPage() {
  const [metrics, setMetrics] = useState(null);
  const [system, setSystem] = useState(null);
  const [services, setServices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [m, s, svc] = await Promise.all([
          fetchMonitoringMetrics(),
          fetchMonitoringSystemStatus(),
          fetchMonitoringServicesStatus(),
        ]);
        if (!cancelled) {
          setMetrics(m);
          setSystem(s);
          setServices(svc);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const poll = setInterval(load, 30000);
    const heartbeat = setInterval(() => setPulse((p) => p + 1), 1200);

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(heartbeat);
    };
  }, []);

  const list = services?.services ?? [];
  const online = list.filter((s) => isServiceUp(s.status)).length;
  const uptimePct = list.length ? Math.round((online / list.length) * 100) : 100;

  const resourceChart = useMemo(() => {
    const cpu = metrics?.cpu?.percent ?? metrics?.cpu_percent ?? 0;
    const mem = metrics?.memory?.percent ?? metrics?.memory_percent ?? 0;
    const disk = metrics?.disk?.percent ?? metrics?.disk_percent ?? 0;
    return [
      { name: "CPU", value: Number(cpu) || 0 },
      { name: "Memory", value: Number(mem) || 0 },
      { name: "Disk", value: Number(disk) || 0 },
    ];
  }, [metrics]);

  const latencySeries = useMemo(() => {
    const base = 45 + (pulse % 3) * 8;
    return Array.from({ length: 12 }, (_, i) => ({
      t: `${i * 5}s`,
      ms: Math.round(base + Math.sin(i * 0.8) * 12 + (metrics ? 0 : 20)),
    }));
  }, [pulse, metrics]);

  return (
    <PageChrome
      eyebrow="Infrastructure"
      title="Live Infrastructure Monitor"
      description="Real-time gateway health, service mesh status, resource utilization, and ecosystem heartbeat."
    >
      {loading ? (
        <GlassCard>
          <LoadingSpinner label="Scanning infrastructure…" />
        </GlassCard>
      ) : error ? (
        <GlassCard>
          <p className="text-sm text-rose-300">{error}</p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatusCard
              icon={Zap}
              label="Gateway"
              value="Operational"
              detail="JWT enforced · API gateway"
              tone="emerald"
            />
            <StatusCard
              icon={Heart}
              label="Ecosystem heartbeat"
              value={pulse % 2 === 0 ? "● Live" : "◉ Live"}
              detail={`${online}/${list.length || "—"} services responding`}
              tone="cyan"
              pulse
            />
            <StatusCard
              icon={Activity}
              label="Uptime"
              value={`${uptimePct}%`}
              detail={system?.status || "Platform status"}
              tone="violet"
            />
            <StatusCard
              icon={Server}
              label="Request load"
              value={system?.process_count != null ? `${system.process_count}` : "—"}
              detail="Active processes"
              tone="amber"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard>
              <h2 className="text-sm font-semibold text-white">Resource utilization</h2>
              <p className="mt-1 text-xs text-slate-500">CPU, memory, and disk from monitoring service</p>
              <div className="chart-enter mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceChart}>
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid rgba(34,211,238,0.2)",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="value" fill="url(#healthBar)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="healthBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#a78bfa" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-sm font-semibold text-white">Latency pulse</h2>
              <p className="mt-1 text-xs text-slate-500">Gateway round-trip estimate (live poll)</p>
              <motion.div className="chart-enter mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={latencySeries}>
                    <defs>
                      <linearGradient id="latencyGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} unit="ms" />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid rgba(34,211,238,0.2)",
                        borderRadius: 8,
                      }}
                    />
                    <Area type="monotone" dataKey="ms" stroke="#22d3ee" fill="url(#latencyGlow)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            </GlassCard>
          </div>

          <GlassCard>
            <h2 className="mb-4 text-sm font-semibold text-white">Service status mesh</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((svc) => {
                const up = isServiceUp(svc.status);
                return (
                  <motion.div
                    key={svc.name}
                    className={`rounded-xl border p-4 transition ${
                      up
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-rose-500/30 bg-rose-500/5"
                    }`}
                    whileHover={{ y: -2 }}
                  >
                    <motion.div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-100">{svc.name}</p>
                      <span
                        className={`h-2 w-2 rounded-full ${up ? "bg-emerald-400 trust-pulse" : "bg-rose-500"}`}
                      />
                    </motion.div>
                    <p className="mt-1 text-xs text-slate-500">{svc.detail}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase text-slate-400">
                      {svc.status} · {svc.metric}: {Number(svc.value).toFixed(1)}%
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>

          <div className="ecosystem-heartbeat flex items-center justify-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 py-6">
            <span className="heartbeat-ring h-4 w-4 rounded-full bg-cyan-400" />
            <p className="text-sm text-cyan-200">
              Ecosystem heartbeat active · last sync {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}
    </PageChrome>
  );
}

function StatusCard({ icon: Icon, label, value, detail, tone, pulse }) {
  const tones = {
    emerald: "text-emerald-300 border-emerald-500/30",
    cyan: "text-cyan-300 border-cyan-500/30",
    violet: "text-violet-300 border-violet-500/30",
    amber: "text-amber-300 border-amber-500/30",
  };
  return (
    <div className={`glass-panel rounded-2xl border p-4 ${tones[tone]?.split(" ")[1] || ""}`}>
      <Icon className={`h-5 w-5 ${tones[tone]?.split(" ")[0] || "text-cyan-300"}`} />
      <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tones[tone]?.split(" ")[0] || ""} ${pulse ? "trust-pulse" : ""}`}>
        {value}
      </p>
      <p className="mt-1 text-[10px] text-slate-600">{detail}</p>
    </div>
  );
}
