import { TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { WidgetFrame } from "./WidgetFrame.jsx";

export function ForecastWidget({ data, loading, error }) {
  const series =
    data?.forecast?.months ||
    data?.savings_forecast ||
    data?.timeline ||
    [];

  const chartData = (Array.isArray(series) ? series : []).slice(0, 8).map((point, i) => ({
    label: point.month || point.label || `M${i + 1}`,
    value: point.trust_score ?? point.value ?? point.amount ?? 0,
  }));

  return (
    <WidgetFrame
      title="Financial Forecast"
      subtitle="Digital twin projection"
      icon={TrendingUp}
      loading={loading}
      error={error}
      href="/twin"
      accent="violet"
      span="md:col-span-2"
    >
      {chartData.length > 0 ? (
        <div className="chart-enter h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="forecastGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#c4b5fd"
                fill="url(#forecastGlow)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Run a twin scenario to populate forecast curves.</p>
      )}
    </WidgetFrame>
  );
}
