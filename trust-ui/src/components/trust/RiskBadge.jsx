const RISK_STYLES = {
  LOW: "border-emerald-400/50 bg-emerald-500/15 text-emerald-200 shadow-[0_0_24px_rgba(52,211,153,0.35)]",
  MEDIUM: "border-amber-400/50 bg-amber-500/15 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.3)]",
  ELEVATED: "border-orange-400/50 bg-orange-500/15 text-orange-100 shadow-[0_0_24px_rgba(251,146,60,0.3)]",
  HIGH: "border-rose-400/50 bg-rose-500/15 text-rose-100 shadow-[0_0_24px_rgba(244,63,94,0.35)]",
};

export function RiskBadge({ level }) {
  const normalized = (level || "MEDIUM").toUpperCase();
  const style = RISK_STYLES[normalized] || RISK_STYLES.MEDIUM;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] ${style}`}
    >
      <span className="trust-pulse h-2 w-2 rounded-full bg-current" aria-hidden />
      {normalized} risk
    </span>
  );
}
