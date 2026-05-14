import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { GlassCard } from "../components/GlassCard.jsx";

export function LoanResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;
  const input = location.state?.input;

  if (!result) {
    return (
      <div className="mx-auto max-w-xl">
        <GlassCard>
          <p className="text-sm text-slate-300">
            No decision payload found. Run a new eligibility check from the loan desk.
          </p>
          <Link
            to="/loan"
            className="mt-4 inline-flex rounded-lg bg-cyan-400/90 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Return to loan desk
          </Link>
        </GlassCard>
      </div>
    );
  }

  const eligible = Boolean(result.eligible);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-cyan-200"
      >
        ← Back to form
      </button>

      <GlassCard className="relative overflow-hidden">
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${
            eligible
              ? "bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400"
              : "bg-gradient-to-r from-rose-500 via-amber-400 to-orange-500"
          }`}
        />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Engine verdict
            </p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold text-white">
              {eligible ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                  Indicative approval
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-rose-300" />
                  Declined at policy gate
                </>
              )}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">{result.reason}</p>
          </div>
          <div className="rounded-2xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-200">Replay context</p>
            <p className="mt-2 font-mono text-[11px] text-cyan-100/90">
              salary={input?.salary}, age={input?.age}, score={input?.credit_score},{" "}
              employment={input?.employment_type}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Max principal
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {result.max_loan_amount?.toLocaleString?.() ?? result.max_loan_amount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              EMI estimate
            </p>
            <p className="mt-2 text-2xl font-semibold text-cyan-200">
              {result.emi_estimate != null
                ? result.emi_estimate.toLocaleString?.() ?? result.emi_estimate
                : "—"}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {(result.tenure_months || 0) + " mo"} @{" "}
              {Math.round((result.annual_interest_rate || 0) * 100)}% APR illustrative
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Policy state
            </p>
            <p className="mt-2 text-sm text-slate-200">
              {eligible
                ? "Applicant cleared deterministic retail gates; human underwriting still required."
                : "Hard stops triggered; no indicative offer generated."}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/loan"
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
          >
            New scenario
          </Link>
          <Link
            to="/dashboard"
            className="rounded-xl border border-slate-700/80 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-500/50 hover:text-white"
          >
            Back to dashboard
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
