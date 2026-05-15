import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

function scoreColor(score) {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#22d3ee";
  if (score >= 40) return "#fbbf24";
  return "#fb7185";
}

export function TrustScoreCard({ score = 0, animated = true }) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const fill = scoreColor(score);
  const chartData = [
    { name: "trust", value: displayScore },
    { name: "gap", value: Math.max(0, 100 - displayScore) },
  ];

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const duration = 900;

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayScore(Math.round(score * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score, animated]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="trust-score-glow pointer-events-none absolute inset-0 rounded-full opacity-60" />
      <div className="relative h-56 w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={96}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={fill} className="trust-score-arc" />
              <Cell fill="rgba(15,23,42,0.9)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
            Trust index
          </p>
          <p className="mt-1 text-5xl font-semibold tabular-nums text-white">{displayScore}</p>
          <p className="text-xs text-slate-500">/ 100</p>
        </div>
      </div>
    </div>
  );
}

