import { useEffect, useState } from "react";
import { Activity, Shield, TrendingUp } from "lucide-react";

const RISK_THEME = {
  LOW: {
    label: "LOW",
    ring: "from-emerald-400 to-cyan-400",
    glow: "risk-glow-low",
    text: "text-emerald-200",
    bar: "bg-emerald-400",
  },
  MEDIUM: {
    label: "MEDIUM",
    ring: "from-amber-400 to-yellow-300",
    glow: "risk-glow-medium",
    text: "text-amber-100",
    bar: "bg-amber-400",
  },
  ELEVATED: {
    label: "ELEVATED",
    ring: "from-orange-400 to-amber-500",
    glow: "risk-glow-medium",
    text: "text-orange-100",
    bar: "bg-orange-400",
  },
  HIGH: {
    label: "HIGH",
    ring: "from-rose-500 to-red-400",
    glow: "risk-glow-high",
    text: "text-rose-100",
    bar: "bg-rose-500",
  },
};

function AnimatedMetric({ label, value, icon: Icon, barClass, textClass }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 900;
    const target = Number(value) || 0;

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(target * eased * 10) / 10);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5 uppercase tracking-wide">
          <Icon className="h-3.5 w-3.5 text-cyan-300/80" />
          {label}
        </span>
        <span className={`font-semibold tabular-nums ${textClass}`}>{display}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
        <div
          className={`h-full rounded-full ${barClass} transition-all duration-1000 ease-out`}
          style={{ width: `${Math.min(100, display)}%` }}
        />
      </div>
    </div>
  );
}

export function RiskHeatIndicator({ indicators, loading = false }) {
  if (loading || !indicators) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-300" />
      </div>
    );
  }

  const level = (indicators.risk_level || "MEDIUM").toUpperCase();
  const theme = RISK_THEME[level] || RISK_THEME.MEDIUM;
  const composite =
    (Number(indicators.trust_confidence) + Number(indicators.financial_safety_score)) / 2;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div
          className={`risk-heat-ring ${theme.glow} relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-gradient-to-br p-[3px] ${theme.ring}`}
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-slate-950/95">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              Risk
            </p>
            <p className={`mt-1 text-xl font-bold ${theme.text}`}>{theme.label}</p>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <AnimatedMetric
            label="Trust confidence"
            value={indicators.trust_confidence}
            icon={Shield}
            barClass="bg-cyan-400"
            textClass="text-cyan-300"
          />
          <AnimatedMetric
            label="Financial safety"
            value={indicators.financial_safety_score}
            icon={TrendingUp}
            barClass={theme.bar}
            textClass={theme.text}
          />
          <AnimatedMetric
            label="Composite heat"
            value={composite}
            icon={Activity}
            barClass="bg-fuchsia-400"
            textClass="text-fuchsia-300"
          />
        </div>
      </div>
    </div>
  );
}
