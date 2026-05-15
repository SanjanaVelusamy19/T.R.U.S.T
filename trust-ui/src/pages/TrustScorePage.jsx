import { useState } from "react";
import { Radar, ShieldHalf } from "lucide-react";
import { TrustGraphDashboard } from "../components/analytics/TrustGraphDashboard.jsx";
import { GlassCard } from "../components/GlassCard.jsx";
import { LoadingSpinner } from "../components/LoadingSpinner.jsx";
import { api } from "../services/api.js";

const EMPLOYMENT_TYPES = [
  { value: "salaried", label: "Salaried" },
  { value: "self_employed", label: "Self employed" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "unemployed", label: "Unemployed" },
];

const DEFAULT_FORM = {
  salary: "50000",
  credit_score: "760",
  repayment_history: "90",
  savings_consistency: "80",
  transaction_stability: "75",
  employment_type: "salaried",
};

export function TrustScorePage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setAnalytics(null);

    const payload = {
      salary: Number(form.salary),
      credit_score: Number(form.credit_score),
      repayment_history: Number(form.repayment_history),
      savings_consistency: Number(form.savings_consistency),
      transaction_stability: Number(form.transaction_stability),
      employment_type: form.employment_type,
    };

    try {
      const { data } = await api.post("/api/trust/calculate", payload);
      setAnalytics(data);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.message;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError("Please review highlighted fields.");
      } else {
        setError("Unable to reach trust analytics service.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
          Adaptive intelligence
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
          TRUST index analytics
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Submit signals to compute a live trust index, then explore the full graph dashboard
          with timeline, radar, risk heat, and AI-style insights.
        </p>
      </div>

      <GlassCard>
        {loading ? (
          <LoadingSpinner label="Computing adaptive trust index…" />
        ) : (
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Radar className="h-5 w-5 text-cyan-300" />
              <p>Submit financial reliability signals for scoring.</p>
            </div>

            {error ? (
              <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Annual salary"
                type="number"
                min={1}
                value={form.salary}
                onChange={(v) => updateField("salary", v)}
              />
              <Field
                label="Credit score"
                type="number"
                min={300}
                max={850}
                value={form.credit_score}
                onChange={(v) => updateField("credit_score", v)}
              />
              <Field
                label="Repayment history %"
                type="number"
                min={0}
                max={100}
                value={form.repayment_history}
                onChange={(v) => updateField("repayment_history", v)}
              />
              <Field
                label="Savings consistency %"
                type="number"
                min={0}
                max={100}
                value={form.savings_consistency}
                onChange={(v) => updateField("savings_consistency", v)}
              />
              <Field
                label="Transaction stability %"
                type="number"
                min={0}
                max={100}
                value={form.transaction_stability}
                onChange={(v) => updateField("transaction_stability", v)}
              />
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Employment type
                </label>
                <select
                  value={form.employment_type}
                  onChange={(e) => updateField("employment_type", e.target.value)}
                  className="neon-ring w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-white focus:border-cyan-400/70"
                >
                  {EMPLOYMENT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(232,121,249,0.35)] transition hover:brightness-110 sm:w-auto sm:min-w-[240px]"
            >
              Calculate TRUST index
            </button>
          </form>
        )}
      </GlassCard>

      {!analytics && !loading ? (
        <GlassCard className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center text-slate-400">
          <ShieldHalf className="h-12 w-12 text-cyan-400/60" />
          <p className="text-sm">
            Run a calculation to unlock the full trust graph and financial analytics dashboard.
          </p>
        </GlassCard>
      ) : null}

      {analytics ? (
        <TrustGraphDashboard data={analytics} loading={loading} showScore />
      ) : null}
    </div>
  );
}

function Field({ label, type, min, max, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </label>
      <input
        type={type}
        required
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="neon-ring w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/70"
      />
    </div>
  );
}
