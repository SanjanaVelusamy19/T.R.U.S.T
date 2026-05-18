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

export function TrustEvolutionChart({ timeline = [], currentScore = 0, loading = false }) {
  if (loading) {
    return <div className="h-56 animate-pulse rounded-xl bg-slate-800/50" />;
  }

  const data = [
    { month: "Now", trust: currentScore, health: currentScore * 0.92 },
    ...timeline.map((p) => ({
      month: p.month,
      trust: p.trust_score,
      health: p.health_index,
    })),
  ];

  return (
    <div className="chart-enter h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[40, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(232,121,249,0.3)",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Line
            type="monotone"
            dataKey="trust"
            name="Trust score"
            stroke="#e879f9"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#e879f9" }}
            className="twin-trust-line"
          />
          <Line
            type="monotone"
            dataKey="health"
            name="Health index"
            stroke="#22d3ee"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: "#22d3ee" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
