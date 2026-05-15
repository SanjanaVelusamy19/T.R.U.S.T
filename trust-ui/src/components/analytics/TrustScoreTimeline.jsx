import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_MARGIN = { top: 8, right: 12, left: -8, bottom: 0 };

function TimelineTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-cyan-500/30 bg-slate-950/95 px-3 py-2 text-xs shadow-[0_0_20px_rgba(34,211,238,0.25)]">
      <p className="font-semibold text-cyan-200">{point.month}</p>
      <p className="mt-1 tabular-nums text-white">
        Trust index <span className="text-cyan-300">{point.score}</span>
      </p>
    </div>
  );
}

export function TrustScoreTimeline({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-950/40">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        No timeline data available.
      </div>
    );
  }

  return (
    <div className="chart-enter h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id="trustLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e879f9" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(51,65,85,0.4)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip content={<TimelineTooltip />} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="url(#trustLineGradient)"
            strokeWidth={3}
            dot={{
              r: 4,
              fill: "#0f172a",
              stroke: "#22d3ee",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: "#22d3ee",
              stroke: "#e879f9",
              strokeWidth: 2,
            }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
