import { Lightbulb, Sparkles } from "lucide-react";

export function RecommendationFeed({ recommendations = [], loading = false }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-800/50" />
        ))}
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <p className="text-sm text-slate-500">
        Recommendations will appear once advisor intelligence is loaded.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {recommendations.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="advisor-recommendation flex items-start gap-3 rounded-xl border border-slate-700/50 bg-slate-950/40 px-4 py-3 transition hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.08)]"
        >
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20">
            {index === 0 ? (
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            ) : (
              <Lightbulb className="h-3.5 w-3.5 text-fuchsia-300" />
            )}
          </span>
          <p className="text-sm leading-relaxed text-slate-200">{item}</p>
        </li>
      ))}
    </ul>
  );
}
