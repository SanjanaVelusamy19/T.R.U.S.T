import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const RELIABILITY_COLORS = {
  HIGH: "#34d399",
  MODERATE: "#fbbf24",
  LOW: "#fb7185",
};

export function FinancialReliabilityMeter({ reliability, trustScore = 0 }) {
  const level = (reliability || "MODERATE").toUpperCase();
  const fill = RELIABILITY_COLORS[level] || RELIABILITY_COLORS.MODERATE;
  const chartData = [
    { name: "score", value: trustScore },
    { name: "remainder", value: Math.max(0, 100 - trustScore) },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Financial reliability
      </p>
      <div className="relative h-44 w-full max-w-xs">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={78}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={fill} />
              <Cell fill="rgba(30,41,59,0.85)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-semibold text-white">{level}</p>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">index band</p>
        </div>
      </div>
    </div>
  );
}