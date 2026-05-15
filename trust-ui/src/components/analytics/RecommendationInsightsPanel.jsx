import { Bot, Sparkles } from "lucide-react";

export function RecommendationInsightsPanel({
  insights = [],
  recommendations = [],
  loading = false,
}) {
  const items = [...insights, ...recommendations].filter(
    (item, index, arr) => arr.indexOf(item) === index,
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-900/60" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className="rounded-xl border border-slate-700/60 bg-slate-950/40 p-4 text-sm text-slate-400">
        AI insights will appear after trust analytics are computed.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300/90">
        <Bot className="h-4 w-4" />
        Intelligence insights
      </div>
      <ul className="space-y-2">
        {items.map((tip) => (
          <li
            key={tip}
            className="insight-card flex gap-3 rounded-xl border border-slate-700/50 bg-gradient-to-r from-slate-950/80 to-slate-900/40 px-4 py-3 text-sm text-slate-200"
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/70" aria-hidden />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
