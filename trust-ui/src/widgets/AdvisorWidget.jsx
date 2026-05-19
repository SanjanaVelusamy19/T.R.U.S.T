import { Brain } from "lucide-react";
import { WidgetFrame } from "./WidgetFrame.jsx";

export function AdvisorWidget({ data, loading, error }) {
  const health = data?.financial_health?.score ?? data?.health_score;
  const recommendations = data?.recommendations || [];
  const top = recommendations[0];

  return (
    <WidgetFrame
      title="AI Recommendations"
      subtitle="Advisor intelligence"
      icon={Brain}
      loading={loading}
      error={error}
      href="/advisor"
      accent="violet"
    >
      {health != null ? (
        <p className="text-2xl font-semibold tabular-nums text-fuchsia-300">
          {Math.round(health)}
          <span className="ml-1 text-sm font-normal text-slate-500">health</span>
        </p>
      ) : null}
      {top ? (
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          {top.summary || top.title || top.message}
        </p>
      ) : (
        <p className="text-xs text-slate-500">No recommendations yet.</p>
      )}
      {recommendations.length > 1 ? (
        <p className="mt-2 text-[10px] text-cyan-500/80">+{recommendations.length - 1} more insights</p>
      ) : null}
    </WidgetFrame>
  );
}
