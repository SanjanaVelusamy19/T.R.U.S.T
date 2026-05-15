import { Sparkles } from "lucide-react";

export function RecommendationsPanel({ recommendations = [] }) {
  if (!recommendations.length) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 p-4 text-sm text-slate-400">
        Run the trust engine to receive adaptive recommendations.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300/90">
        <Sparkles className="h-4 w-4" />
        Adaptive recommendations
      </div>
      <ul className="space-y-2">
        {recommendations.map((tip) => (
          <li
            key={tip}
            className="rounded-xl border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm text-slate-200"
          >
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
