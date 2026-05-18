import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function RiskTimelineWidget({ timeline = [], loading = false }) {
  if (loading) {
    return <div className="h-56 animate-pulse rounded-xl bg-slate-800/50" />;
  }

  const data = timeline.map((point) => ({
    month: point.month,
    trust: point.trust_score,
    fraud: point.fraud_risk,
  }));

  return (
    <div className="chart-enter h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(34,211,238,0.25)",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="trust"
            name="Trust score"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ r: 3, fill: "#22d3ee" }}
          />
          <Line
            type="monotone"
            dataKey="fraud"
            name="Fraud risk"
            stroke="#fb7185"
            strokeWidth={2}
            dot={{ r: 3, fill: "#fb7185" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
