import { Radar } from "lucide-react";
import { TrustScoreCard } from "../components/trust/TrustScoreCard.jsx";
import { WidgetFrame } from "./WidgetFrame.jsx";

export function TrustWidget({ data, loading, error }) {
  const score = data?.trust_score ?? data?.score ?? 0;
  const trend = data?.trend_label || data?.momentum || "Stable trajectory";

  return (
    <WidgetFrame
      title="Trust Score"
      subtitle="Adaptive intelligence index"
      icon={Radar}
      loading={loading}
      error={error}
      href="/trust"
      span="md:col-span-1"
      accent="cyan"
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:justify-between">
        <TrustScoreCard score={Math.round(score)} />
        <div className="text-center sm:text-left">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Momentum</p>
          <p className="mt-1 text-sm font-medium text-cyan-200">{trend}</p>
          {data?.risk_level ? (
            <p className="mt-2 text-xs text-slate-400">
              Risk band: <span className="text-slate-200">{data.risk_level}</span>
            </p>
          ) : null}
        </div>
      </div>
    </WidgetFrame>
  );
}
