import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function HealthTimelineChart({ history = [], loading = false }) {
  if (loading) {
    return <div className="h-52 animate-pulse rounded-xl bg-slate-800/50" />;
  }

  const data = history.map((h) => ({
    t: h.timestamp?.slice(11, 19) || "—",
    healthy: h.healthy_services,
    avgMs: h.avg_latency_ms,
  }));

  if (!data.length) {
    return (
      <p className="py-8 text-center text-xs text-slate-500">
        Poll system health to build infrastructure timeline.
      </p>
    );
  }

  return (
    <div className="chart-enter h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
          <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(34,211,238,0.2)",
              borderRadius: "12px",
              fontSize: "11px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="healthy"
            name="Healthy services"
            stroke="#34d399"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avgMs"
            name="Avg latency (ms)"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
