import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { GlassCard } from "../components/GlassCard.jsx";
import { LoadingSpinner } from "../components/LoadingSpinner.jsx";
import { api } from "../services/api.js";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "self_employed", label: "Self employed" },
  { value: "unemployed", label: "Unemployed" },
];

export function LoanEligibilityPage() {
  const navigate = useNavigate();
  const [salary, setSalary] = useState("");
  const [age, setAge] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [creditScore, setCreditScore] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        salary: Number(salary),
        age: Number(age),
        employment_type: employmentType,
        credit_score: Number(creditScore),
      };
      const { data } = await api.post("/api/loan/check-loan", payload);
      navigate("/loan/result", { state: { result: data, input: payload } });
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError("Please review highlighted fields.");
      } else {
        setError("Unable to reach loan policy service.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
          Retail simulation
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
          Loan eligibility desk
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Submissions are authenticated at the gateway, forwarded to the loan
          microservice, and evaluated using deterministic policy code suitable for
          regulatory replay.
        </p>
      </div>

      <GlassCard>
        {loading ? (
          <LoadingSpinner label="Consulting TRUST credit policies…" />
        ) : (
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <ClipboardList className="h-5 w-5 text-cyan-300" />
              <p>Provide applicant attributes for an indicative decision.</p>
            </div>

            {error ? (
              <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </p>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Annual gross salary
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  step="1000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="neon-ring w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/70"
                  placeholder="75000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Age
                </label>
                <input
                  type="number"
                  required
                  min={18}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="neon-ring w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/70"
                  placeholder="34"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Credit score (300–850)
                </label>
                <input
                  type="number"
                  required
                  min={300}
                  max={850}
                  value={creditScore}
                  onChange={(e) => setCreditScore(e.target.value)}
                  className="neon-ring w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400/70"
                  placeholder="720"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Employment type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
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
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.45)] transition hover:brightness-110"
            >
              Run eligibility engine
            </button>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
