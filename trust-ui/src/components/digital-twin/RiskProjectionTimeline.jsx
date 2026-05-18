import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const riskColors = { LOW: "#34d399", MEDIUM: "#fbbf24", HIGH: "#fb7185" };

export function RiskProjectionTimeline({ timeline = [], loading = false }) {
  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-slate-800/50" />;
  }

  const data = timeline.map((p) => ({
    month: p.month,
    risk: p.risk_index,
    level: p.risk_level,
  }));

  return (
    <div className="chart-enter h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="twinRiskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#fb7185" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value, _name, item) => [
              `${value} (${item?.payload?.level ?? "—"})`,
              "Risk index",
            ]}
            contentStyle={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(251,113,133,0.3)",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="risk"
            stroke="#fb7185"
            fill="url(#twinRiskGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      {data.length > 0 && (
        <p className="mt-2 text-center text-[10px] text-slate-500">
          Terminal projection:{" "}
          <span style={{ color: riskColors[data[data.length - 1].level] || "#94a3b8" }}>
            {data[data.length - 1].level}
          </span>
        </p>
      )}
    </div>
  );
}
