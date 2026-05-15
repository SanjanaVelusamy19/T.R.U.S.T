import { Activity } from "lucide-react";

function scoreTone(score) {
  if (score >= 80) return "from-emerald-400 to-cyan-400";
  if (score >= 60) return "from-amber-300 to-cyan-400";
  return "from-rose-400 to-fuchsia-500";
}

export function FinancialHealthScore({ score = 0, loading = false }) {
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" />
      </div>
    );
  }

  const tone = scoreTone(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="advisor-health-widget flex flex-col items-center justify-center py-2">
      <div className="relative h-36 w-36">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(51,65,85,0.6)"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="url(#healthGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#e879f9" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`bg-gradient-to-br ${tone} bg-clip-text text-4xl font-bold tabular-nums text-transparent`}
          >
            {score}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Health
          </span>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <Activity className="h-3.5 w-3.5 text-cyan-300" />
        Composite financial wellness index
      </p>
    </div>
  );
}
