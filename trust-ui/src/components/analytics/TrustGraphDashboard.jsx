import { LineChart, Radar as RadarIcon, ShieldAlert } from "lucide-react";
import { GlassCard } from "../GlassCard.jsx";
import { FinancialStabilityRadar } from "./FinancialStabilityRadar.jsx";
import { RecommendationInsightsPanel } from "./RecommendationInsightsPanel.jsx";
import { RiskHeatIndicator } from "./RiskHeatIndicator.jsx";
import { TrustAnalyticsPanel } from "./TrustAnalyticsPanel.jsx";
import { TrustScoreTimeline } from "./TrustScoreTimeline.jsx";
import { TrustScoreCard } from "../trust/TrustScoreCard.jsx";

export function TrustGraphDashboard({
  data,
  loading = false,
  error = "",
  showScore = true,
}) {
  const timeline = data?.timeline ?? [];
  const radar = data?.radar ?? [];
  const cards = data?.analytics_cards ?? [];
  const indicators = data?.risk_indicators;
  const insights = data?.insights ?? [];
  const recommendations = data?.recommendations ?? [];

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      {showScore && data?.trust_score != null ? (
        <GlassCard className="flex flex-col items-center justify-center py-6 sm:flex-row sm:gap-10">
          <TrustScoreCard score={data.trust_score} />
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
              Live trust index
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {data.financial_reliability || "—"} reliability band
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Gateway-sourced adaptive financial intelligence
            </p>
          </div>
        </GlassCard>
      ) : null}

      <TrustAnalyticsPanel cards={cards} loading={loading} />

      <div className="grid gap-6 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2">
          <header className="mb-4 flex items-center gap-2">
            <LineChart className="h-5 w-5 text-cyan-300" />
            <div>
              <h2 className="text-sm font-semibold text-white">Trust score timeline</h2>
              <p className="text-xs text-slate-500">Progression over recent periods</p>
            </div>
          </header>
          <TrustScoreTimeline data={timeline} loading={loading} />
        </GlassCard>

        <GlassCard>
          <header className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-300" />
            <div>
              <h2 className="text-sm font-semibold text-white">Risk heat indicator</h2>
              <p className="text-xs text-slate-500">Confidence & safety signals</p>
            </div>
          </header>
          <RiskHeatIndicator indicators={indicators} loading={loading} />
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <header className="mb-4 flex items-center gap-2">
            <RadarIcon className="h-5 w-5 text-fuchsia-300" />
            <div>
              <h2 className="text-sm font-semibold text-white">Financial stability radar</h2>
              <p className="text-xs text-slate-500">Multi-axis behavioral profile</p>
            </div>
          </header>
          <FinancialStabilityRadar data={radar} loading={loading} />
        </GlassCard>

        <GlassCard>
          <RecommendationInsightsPanel
            insights={insights}
            recommendations={recommendations}
            loading={loading}
          />
        </GlassCard>
      </div>
    </div>
  );
}
