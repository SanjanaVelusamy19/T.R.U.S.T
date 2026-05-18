import { Coins, Scale, Shield, Sparkles, TrendingUp } from "lucide-react";
import { GlassCard } from "../GlassCard.jsx";
import { LoadingSpinner } from "../LoadingSpinner.jsx";
import { CollateralValueChart } from "./CollateralValueChart.jsx";

const PURITY_OPTIONS = [
  { value: "24K", label: "24K (99.9%)" },
  { value: "22K", label: "22K (91.6%)" },
  { value: "18K", label: "18K (75%)" },
  { value: "14K", label: "14K (58.3%)" },
];

function formatCurrency(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function riskTone(level) {
  const normalized = String(level || "").toUpperCase();
  if (normalized === "LOW") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  if (normalized === "MEDIUM") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  if (normalized === "HIGH") return "border-orange-500/40 bg-orange-500/10 text-orange-200";
  return "border-rose-500/40 bg-rose-500/10 text-rose-200";
}

function SafetyMeter({ score, label }) {
  const clamped = Math.min(100, Math.max(0, Number(score) || 0));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-amber-100">{clamped.toFixed(0)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(251,191,36,0.4)] transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function GoldLoanPanel({
  evaluation,
  riskAnalysis,
  interestRates,
  recommendations,
  chartData,
  loading,
  evaluating,
  error,
  weight,
  purity,
  monthlyIncome,
  requestedAmount,
  tenureMonths,
  onWeightChange,
  onPurityChange,
  onMonthlyIncomeChange,
  onRequestedAmountChange,
  onTenureChange,
  onEvaluate,
  compact = false,
}) {
  const showForm = !compact;

  return (
    <div className="space-y-6">
      {showForm ? (
        <GlassCard className="gold-loan-panel relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/90">
              Gold loan calculator
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">Collateral valuation desk</h2>
            <p className="mt-2 text-sm text-slate-400">
              Enter pledged gold weight and purity for trust-aware lending limits.
            </p>

            {error ? (
              <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </p>
            ) : null}

            <form
              className="mt-6 grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                onEvaluate?.();
              }}
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Gold weight (grams)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  step="0.1"
                  value={weight}
                  onChange={(e) => onWeightChange(e.target.value)}
                  className="neon-ring w-full rounded-xl border border-amber-500/30 bg-slate-950/60 px-3 py-2.5 text-sm text-white focus:border-amber-400/70"
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Purity
                </label>
                <select
                  value={purity}
                  onChange={(e) => onPurityChange(e.target.value)}
                  className="neon-ring w-full rounded-xl border border-amber-500/30 bg-slate-950/60 px-3 py-2.5 text-sm text-white focus:border-amber-400/70"
                >
                  {PURITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Monthly income (optional)
                </label>
                <input
                  type="number"
                  min={0}
                  step="1000"
                  value={monthlyIncome}
                  onChange={(e) => onMonthlyIncomeChange(e.target.value)}
                  className="neon-ring w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-white"
                  placeholder="85000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Requested loan (optional)
                </label>
                <input
                  type="number"
                  min={0}
                  step="1000"
                  value={requestedAmount}
                  onChange={(e) => onRequestedAmountChange(e.target.value)}
                  className="neon-ring w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-white"
                  placeholder="220000"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tenure (months)
                </label>
                <input
                  type="number"
                  min={3}
                  max={36}
                  value={tenureMonths}
                  onChange={(e) => onTenureChange(e.target.value)}
                  className="neon-ring w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-white sm:max-w-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={evaluating}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.35)] transition hover:brightness-110 disabled:opacity-60"
                >
                  {evaluating ? "Evaluating collateral…" : "Run gold loan intelligence"}
                </button>
              </div>
            </form>
          </div>
        </GlassCard>
      ) : null}

      {loading ? (
        <GlassCard>
          <LoadingSpinner label="Loading gold lending intelligence…" />
        </GlassCard>
      ) : null}

      {evaluation ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: Coins,
                label: "Estimated gold value",
                value: formatCurrency(evaluation.estimated_gold_value),
              },
              {
                icon: Scale,
                label: "Eligible loan (LTV)",
                value: formatCurrency(evaluation.eligible_loan_amount),
              },
              {
                icon: Shield,
                label: "Trust-adjusted limit",
                value: formatCurrency(evaluation.trust_adjusted_limit),
              },
              {
                icon: TrendingUp,
                label: "Interest rate",
                value: evaluation.interest_rate,
              },
            ].map(({ icon: Icon, label, value }) => (
              <GlassCard key={label} className="gold-loan-panel">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-2 text-lg font-semibold text-amber-100">{value}</p>
                  </div>
                  <Icon className="h-8 w-8 text-amber-400/80" />
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard className="gold-loan-panel">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                    Eligibility outcome
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {evaluation.eligible ? "Approved for disbursement simulation" : "Conditional / declined"}
                  </h3>
                </div>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase ${riskTone(evaluation.risk_level)}`}
                >
                  {evaluation.risk_level}
                </span>
              </div>
              <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Weight / purity</dt>
                  <dd className="mt-1 font-medium text-slate-100">
                    {evaluation.gold_weight_grams}g · {evaluation.purity}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Trust score</dt>
                  <dd className="mt-1 font-medium text-cyan-200">{evaluation.trust_score}</dd>
                </div>
              </dl>
              <ul className="mt-6 space-y-2">
                {evaluation.recommendations?.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 rounded-lg border border-amber-500/15 bg-slate-950/40 px-3 py-2 text-sm text-slate-300"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard className="gold-loan-panel">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                Collateral value chart
              </p>
              <CollateralValueChart data={chartData} loading={evaluating} />
            </GlassCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <GlassCard className="gold-loan-panel lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                Repayment safety
              </p>
              <div className="mt-6 space-y-5">
                <SafetyMeter score={evaluation.repayment_safety_score} label="Repayment capacity" />
                <SafetyMeter
                  score={100 - evaluation.collateral_risk_score}
                  label="Collateral strength"
                />
              </div>
            </GlassCard>

            {riskAnalysis ? (
              <GlassCard className="gold-loan-panel lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                  Risk assessment
                </p>
                <p className="mt-2 text-sm text-slate-400">{riskAnalysis.summary}</p>
                <ul className="mt-4 space-y-3">
                  {riskAnalysis.factors?.map((factor) => (
                    <li
                      key={factor.name}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/30 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-slate-100">{factor.name}</p>
                        <p className="text-xs text-slate-500">{factor.detail}</p>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${riskTone(factor.status)}`}
                      >
                        {factor.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {interestRates ? (
              <GlassCard className="gold-loan-panel">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                  Interest rate insights
                </p>
                <p className="mt-2 text-2xl font-semibold text-amber-100">
                  {interestRates.current_applicable_rate}
                  <span className="ml-2 text-sm font-normal text-slate-500">your tier</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {interestRates.tiers?.map((tier) => (
                    <li
                      key={tier.tier}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-slate-200">{tier.tier}</p>
                        <p className="text-xs text-slate-500">Trust {tier.trust_range}</p>
                      </div>
                      <p className="font-semibold text-amber-200">{tier.annual_rate}</p>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ) : null}

            {recommendations ? (
              <GlassCard className="gold-loan-panel">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                  Adaptive lending recommendations
                </p>
                <ul className="mt-4 space-y-3">
                  {recommendations.recommendations?.map((rec) => (
                    <li
                      key={rec.title}
                      className="rounded-xl border border-amber-500/15 bg-slate-950/40 px-4 py-3"
                    >
                      <p className="font-medium text-amber-100">{rec.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{rec.detail}</p>
                    </li>
                  ))}
                </ul>
                {recommendations.adaptive_insights?.length ? (
                  <ul className="mt-4 space-y-2 border-t border-slate-800/80 pt-4">
                    {recommendations.adaptive_insights.map((insight) => (
                      <li key={insight} className="text-sm text-slate-400">
                        · {insight}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </GlassCard>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
