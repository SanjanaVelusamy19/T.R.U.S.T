import { ScanEye } from "lucide-react";
import { FraudRiskIndicator } from "../components/fraud/FraudRiskIndicator.jsx";
import { WidgetFrame } from "./WidgetFrame.jsx";

export function FraudWidget({ data, loading, error }) {
  const score = data?.risk_score ?? data?.score ?? 0;
  const level = data?.risk_level ?? data?.riskLevel ?? "LOW";

  return (
    <WidgetFrame
      title="Fraud Risk"
      subtitle="Behavioral security surface"
      icon={ScanEye}
      loading={loading}
      error={error}
      href="/security"
      accent="rose"
    >
      <div className="flex justify-center py-2">
        <FraudRiskIndicator score={score} riskLevel={level} loading={loading} />
      </div>
      {data?.summary ? (
        <p className="mt-2 text-center text-[11px] text-slate-400">{data.summary}</p>
      ) : null}
    </WidgetFrame>
  );
}
