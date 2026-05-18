import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatCurrency(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function GoldTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-amber-500/30 bg-slate-950/95 px-3 py-2 text-xs shadow-[0_0_20px_rgba(251,191,36,0.2)]">
      <p className="font-semibold text-amber-200">{point.label}</p>
      <p className="mt-1 tabular-nums text-white">{formatCurrency(point.value)}</p>
    </div>
  );
}

export function CollateralValueChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-amber-500/20 bg-slate-950/40">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-300" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-500">
        Run valuation to visualize collateral.
      </div>
    );
  }

  return (
    <div className="h-56 w-full chart-enter">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip content={<GoldTooltip />} cursor={{ fill: "rgba(251,191,36,0.08)" }} />
          <Bar dataKey="value" fill="url(#goldBar)" radius={[8, 8, 0, 0]} maxBarSize={56} />
          <defs>
            <linearGradient id="goldBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
