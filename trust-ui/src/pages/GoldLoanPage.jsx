import { useCallback, useEffect, useState } from "react";
import { GoldLoanPanel } from "../components/gold-loan/GoldLoanPanel.jsx";
import {
  evaluateGoldLoan,
  fetchGoldLoanInterestRates,
  fetchGoldLoanRecommendations,
  fetchGoldLoanRiskAnalysis,
} from "../services/goldLoanApi.js";

function buildChartData(evaluation) {
  if (!evaluation) return [];
  return [
    { label: "Gold value", value: evaluation.estimated_gold_value },
    { label: "Max eligible", value: evaluation.eligible_loan_amount },
    { label: "Trust-adjusted", value: evaluation.trust_adjusted_limit },
  ];
}

export function GoldLoanPage() {
  const [weight, setWeight] = useState("50");
  const [purity, setPurity] = useState("22K");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [tenureMonths, setTenureMonths] = useState("12");
  const [evaluation, setEvaluation] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [interestRates, setInterestRates] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");

  const loadInsights = useCallback(async (grams, purityValue) => {
    const params = {
      gold_weight_grams: Number(grams) || 50,
      purity: purityValue,
    };
    const [risk, rates, recs] = await Promise.all([
      fetchGoldLoanRiskAnalysis(params),
      fetchGoldLoanInterestRates(),
      fetchGoldLoanRecommendations(params),
    ]);
    setRiskAnalysis(risk);
    setInterestRates(rates);
    setRecommendations(recs);
  }, []);

  const runEvaluation = useCallback(async () => {
    setEvaluating(true);
    setError("");
    const grams = Number(weight);
    try {
      const payload = {
        gold_weight_grams: grams,
        purity,
        tenure_months: Number(tenureMonths) || 12,
      };
      if (monthlyIncome) payload.monthly_income = Number(monthlyIncome);
      if (requestedAmount) payload.requested_loan_amount = Number(requestedAmount);

      const [result] = await Promise.all([
        evaluateGoldLoan(payload),
        loadInsights(grams, purity),
      ]);
      setEvaluation(result);
    } catch (err) {
      setError(
        err.message ||
          "Unable to evaluate gold collateral. Ensure gold-loan-service is running on port 8008.",
      );
    } finally {
      setEvaluating(false);
    }
  }, [weight, purity, monthlyIncome, requestedAmount, tenureMonths, loadInsights]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError("");
      try {
        await loadInsights(weight, purity);
        if (!cancelled) await runEvaluation();
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load gold loan intelligence. Ensure the gateway and gold-loan-service are running.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300/80">
          Collateral-backed lending
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Digital gold loan desk</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Trust-aware valuation, eligibility limits, and adaptive rate guidance for pledged gold
          collateral — brokered exclusively through the API gateway.
        </p>
      </div>
      <GoldLoanPanel
        evaluation={evaluation}
        riskAnalysis={riskAnalysis}
        interestRates={interestRates}
        recommendations={recommendations}
        chartData={buildChartData(evaluation)}
        loading={loading}
        evaluating={evaluating}
        error={error}
        weight={weight}
        purity={purity}
        monthlyIncome={monthlyIncome}
        requestedAmount={requestedAmount}
        tenureMonths={tenureMonths}
        onWeightChange={setWeight}
        onPurityChange={setPurity}
        onMonthlyIncomeChange={setMonthlyIncome}
        onRequestedAmountChange={setRequestedAmount}
        onTenureChange={setTenureMonths}
        onEvaluate={runEvaluation}
      />
    </div>
  );
}
