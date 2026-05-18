import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function LatencyChart({ metrics = [], loading = false }) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-slate-800/50" />;
  }

  const data = metrics.map((m) => ({
    name: m.service.replace(" Service", "").replace("API ", "").slice(0, 12),
    latency: Math.round(m.latency_ms),
    baseline: Math.round(m.baseline_ms),
    delta: m.delta_ms,
  }));

  const barColor = (row) => {
    if (row.latency > row.baseline + 15) return "#fb7185";
    if (row.latency > row.baseline + 8) return "#fbbf24";
    return "#22d3ee";
  };

  return (
    <div className="chart-enter h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-16}
            textAnchor="end"
            height={44}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            unit=" ms"
          />
          <Tooltip
            formatter={(value, _name, item) => {
              const p = item?.payload ?? {};
              return [`${value} ms (baseline ${p.baseline} ms, Δ${p.delta})`, "Latency"];
            }}
            contentStyle={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(34,211,238,0.25)",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="latency" name="Latency" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}-${index}`} fill={barColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
