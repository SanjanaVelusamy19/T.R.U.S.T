import { BellRing, Lightbulb } from "lucide-react";

export function AdaptiveSecurityNotifications({
  warnings = [],
  recommendations = [],
  loading = false,
}) {
  if (loading) {
    return <div className="h-32 animate-pulse rounded-xl bg-slate-800/50" />;
  }

  return (
    <div className="space-y-4">
      {warnings.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-300/90">
            <BellRing className="h-3.5 w-3.5" />
            Adaptive warnings
          </p>
          <ul className="space-y-2">
            {warnings.map((item) => (
              <li
                key={item}
                className="fraud-adaptive-warning rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2 text-xs text-fuchsia-100"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {recommendations.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-300/90">
            <Lightbulb className="h-3.5 w-3.5" />
            Recommendations
          </p>
          <ul className="space-y-2">
            {recommendations.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-50/90"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!warnings.length && !recommendations.length && (
        <p className="text-xs text-slate-500">Adaptive engine monitoring — no actions pending.</p>
      )}
    </div>
  );
}
