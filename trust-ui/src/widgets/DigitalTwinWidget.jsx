import { Orbit } from "lucide-react";
import { WidgetFrame } from "./WidgetFrame.jsx";

export function DigitalTwinWidget({ data, loading, error }) {
  const trust = data?.projected_trust_score ?? data?.trust_projection;
  const savings = data?.projected_savings ?? data?.savings_projection;

  return (
    <WidgetFrame
      title="Digital Twin"
      subtitle="Scenario simulation"
      icon={Orbit}
      loading={loading}
      error={error}
      href="/twin"
      accent="violet"
    >
      <div className="flex items-center gap-4">
        <div className="twin-orbit-icon flex h-14 w-14 items-center justify-center rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10">
          <Orbit className="h-7 w-7 text-fuchsia-300" />
        </div>
        <div className="space-y-2 text-xs">
          {trust != null ? (
            <p className="text-slate-300">
              Trust projection:{" "}
              <span className="font-semibold text-fuchsia-200">{Math.round(trust)}</span>
            </p>
          ) : null}
          {savings != null ? (
            <p className="text-slate-300">
              Savings outlook:{" "}
              <span className="font-semibold text-cyan-200">
                {typeof savings === "number" ? savings.toLocaleString() : savings}
              </span>
            </p>
          ) : null}
          {!trust && !savings && !loading ? (
            <p className="text-slate-500">Open twin lab to run scenarios.</p>
          ) : null}
        </div>
      </div>
    </WidgetFrame>
  );
}
