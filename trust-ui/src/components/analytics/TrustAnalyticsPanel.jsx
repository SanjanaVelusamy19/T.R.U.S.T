import { BarChart3, Brain, PiggyBank, Repeat, Zap } from "lucide-react";

const CARD_ICONS = {
  "Financial Reliability": BarChart3,
  "Behavioral Stability": Brain,
  "Savings Discipline": PiggyBank,
  "Repayment Strength": Repeat,
  "Trust Momentum": Zap,
};

export function TrustAnalyticsPanel({ cards = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-slate-800/60 bg-slate-950/50"
          />
        ))}
      </div>
    );
  }

  if (!cards.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = CARD_ICONS[card.label] || BarChart3;
        return (
          <article
            key={card.label}
            className="analytics-card group rounded-xl border border-slate-700/50 bg-slate-950/50 p-4 transition hover:border-cyan-500/35 hover:shadow-[0_0_24px_rgba(34,211,238,0.12)]"
          >
            <div className="flex items-start justify-between gap-2">
              <Icon className="h-4 w-4 text-cyan-300/80 transition group-hover:text-cyan-200" />
              {card.trend ? (
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                  {card.trend}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {Math.round(card.value)}
              <span className="text-sm font-normal text-slate-500">/100</span>
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all duration-700"
                style={{ width: `${Math.min(100, card.value)}%` }}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
