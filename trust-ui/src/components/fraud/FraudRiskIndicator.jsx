import { ShieldAlert } from "lucide-react";

const levelStyles = {
  LOW: { ring: "risk-glow-low", text: "text-emerald-300", border: "border-emerald-500/40" },
  MEDIUM: { ring: "risk-glow-medium", text: "text-amber-300", border: "border-amber-500/40" },
  HIGH: { ring: "risk-glow-high", text: "text-rose-300", border: "border-rose-500/40" },
  CRITICAL: { ring: "fraud-risk-critical", text: "text-rose-200", border: "border-rose-400/60" },
};

export function FraudRiskIndicator({ score = 0, riskLevel = "LOW", loading = false }) {
  const palette = levelStyles[riskLevel] || levelStyles.LOW;
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <div className={`relative h-36 w-36 ${loading ? "opacity-40" : ""}`}>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="rgba(148,163,184,0.15)"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={loading ? circumference : offset}
            className={`fraud-risk-arc transition-all duration-1000 ${palette.text}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {loading ? (
            <span className="h-8 w-16 animate-pulse rounded bg-slate-800/60" />
          ) : (
            <>
              <span className={`text-3xl font-bold tabular-nums ${palette.text}`}>{score}</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500">Risk index</span>
            </>
          )}
        </div>
      </div>
      {!loading && (
        <div
          className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${palette.border} ${palette.text} ${palette.ring}`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          {riskLevel}
        </div>
      )}
    </div>
  );
}
