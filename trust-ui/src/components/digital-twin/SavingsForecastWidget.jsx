import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SavingsForecastWidget({ forecast = [], current = 0, projected = 0, loading = false }) {
  if (loading) {
    return <div className="h-44 animate-pulse rounded-xl bg-slate-800/50" />;
  }

  const data = forecast.map((p) => ({
    month: p.month,
    savings: p.savings_index,
    growth: p.growth_rate_pct,
  }));

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Savings index</p>
          <p className="text-2xl font-semibold tabular-nums text-cyan-200">{Math.round(current)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Projected</p>
          <p className="text-2xl font-semibold tabular-nums text-fuchsia-200">{Math.round(projected)}</p>
        </div>
      </div>
      <div className="chart-enter h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(34,211,238,0.25)",
                borderRadius: "12px",
                fontSize: "11px",
              }}
            />
            <Bar dataKey="savings" name="Savings" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
