import { Brain, PiggyBank, Scale, Shield, TrendingUp, Wallet } from "lucide-react";

const CATEGORY_ICONS = {
  Savings: PiggyBank,
  EMI: Scale,
  Spending: Wallet,
  Trust: TrendingUp,
  default: Brain,
};

const PRIORITY_STYLES = {
  high: "border-rose-500/35 bg-rose-500/10",
  medium: "border-cyan-500/30 bg-cyan-500/10",
  low: "border-slate-600/50 bg-slate-900/40",
};

export function SmartInsightCards({ insights = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/50" />
        ))}
      </div>
    );
  }

  if (!insights.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {insights.map((insight) => {
        const Icon = CATEGORY_ICONS[insight.category] || CATEGORY_ICONS.default;
        const style = PRIORITY_STYLES[insight.priority] || PRIORITY_STYLES.medium;
        return (
          <article
            key={`${insight.category}-${insight.title}`}
            className={`insight-card advisor-insight-card rounded-xl border p-4 ${style}`}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950/60 ring-1 ring-white/10">
                <Icon className="h-4 w-4 text-cyan-300" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {insight.category}
                </p>
                <h3 className="mt-0.5 text-sm font-semibold text-white">{insight.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{insight.detail}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
