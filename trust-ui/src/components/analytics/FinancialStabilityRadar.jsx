import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function RadarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-fuchsia-500/30 bg-slate-950/95 px-3 py-2 text-xs">
      <p className="text-fuchsia-200">{item.label}</p>
      <p className="mt-1 font-semibold tabular-nums text-white">{item.value}%</p>
    </div>
  );
}

export function FinancialStabilityRadar({ data = [], loading = false }) {
  const chartData = data.map((d) => ({
    subject: d.label,
    label: d.label,
    value: d.value,
    fullMark: 100,
  }));

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-fuchsia-400/30 border-t-fuchsia-300" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-slate-500">
        Radar metrics unavailable.
      </div>
    );
  }

  return (
    <div className="chart-enter h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
          <defs>
            <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(34,211,238,0.55)" />
              <stop offset="100%" stopColor="rgba(232,121,249,0.15)" />
            </linearGradient>
          </defs>
          <PolarGrid stroke="rgba(71,85,105,0.5)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#475569", fontSize: 9 }}
            axisLine={false}
          />
          <Tooltip content={<RadarTooltip />} />
          <Radar
            name="Stability"
            dataKey="value"
            stroke="#22d3ee"
            fill="url(#radarFill)"
            fillOpacity={0.75}
            strokeWidth={2}
            animationDuration={1000}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
