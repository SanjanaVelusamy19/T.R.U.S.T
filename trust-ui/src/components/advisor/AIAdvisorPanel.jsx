import { Bot, BrainCircuit } from "lucide-react";
import { GlassCard } from "../GlassCard.jsx";
import { FinancialHealthScore } from "./FinancialHealthScore.jsx";
import { RecommendationFeed } from "./RecommendationFeed.jsx";
import { RiskWarningAlerts } from "./RiskWarningAlerts.jsx";
import { SmartInsightCards } from "./SmartInsightCards.jsx";

export function AIAdvisorPanel({ data, loading = false, error = "" }) {
  const summary = data?.advisor_summary ?? "";
  const recommendations = data?.recommendations ?? [];
  const warnings = data?.risk_warnings ?? [];
  const healthScore = data?.financial_health_score ?? 0;
  const insights = data?.insights ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-fuchsia-300/80">
            Adaptive intelligence
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
            <BrainCircuit className="h-6 w-6 text-cyan-300" />
            AI Financial Advisor
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Rule-based adaptive guidance synthesized from trust analytics, repayment behavior,
            and financial reliability signals.
          </p>
        </div>
        <span className="advisor-badge inline-flex items-center gap-2 self-start rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
          <Bot className="h-3.5 w-3.5" />
          Deterministic AI engine
        </span>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2 advisor-panel-glow">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">Executive summary</h3>
            <p className="text-xs text-slate-500">Synthesized financial health narrative</p>
          </header>
          {loading ? (
            <div className="h-16 animate-pulse rounded-lg bg-slate-800/50" />
          ) : (
            <p className="text-sm leading-relaxed text-slate-300">{summary || "—"}</p>
          )}
          <div className="mt-6">
            <SmartInsightCards insights={insights} loading={loading} />
          </div>
        </GlassCard>

        <GlassCard className="advisor-panel-glow">
          <header className="mb-4 text-center">
            <h3 className="text-sm font-semibold text-white">Financial health score</h3>
            <p className="text-xs text-slate-500">Composite wellness index</p>
          </header>
          <FinancialHealthScore score={healthScore} loading={loading} />
          {!loading && data?.risk_level ? (
            <p className="mt-4 text-center text-xs text-slate-400">
              Risk band:{" "}
              <span className="font-semibold text-cyan-200">{data.risk_level}</span>
              {" · "}
              Trust: <span className="font-semibold text-fuchsia-200">{data.trust_score}</span>
            </p>
          ) : null}
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="advisor-panel-glow">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">Adaptive recommendations</h3>
            <p className="text-xs text-slate-500">Savings, EMI, loan safety & trust velocity</p>
          </header>
          <RecommendationFeed recommendations={recommendations} loading={loading} />
        </GlassCard>

        <GlassCard className="advisor-panel-glow">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">Risk warnings</h3>
            <p className="text-xs text-slate-500">Early signals requiring attention</p>
          </header>
          <RiskWarningAlerts warnings={warnings} loading={loading} />
        </GlassCard>
      </div>
    </section>
  );
}
