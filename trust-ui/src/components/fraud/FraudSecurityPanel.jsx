import { Fingerprint, ScanEye } from "lucide-react";
import { GlassCard } from "../GlassCard.jsx";
import { AdaptiveSecurityNotifications } from "./AdaptiveSecurityNotifications.jsx";
import { BehavioralAnalysisCards } from "./BehavioralAnalysisCards.jsx";
import { FraudRiskIndicator } from "./FraudRiskIndicator.jsx";
import { RiskTimelineWidget } from "./RiskTimelineWidget.jsx";
import { SecurityAlertPanel } from "./SecurityAlertPanel.jsx";

const statusLabels = {
  NORMAL: "Baseline secure",
  ELEVATED_MONITORING: "Elevated monitoring",
  SUSPICIOUS_ACTIVITY_DETECTED: "Suspicious activity",
  HIGH_RISK_BEHAVIOR: "High-risk behavior",
};

export function FraudSecurityPanel({ data, loading = false, error = "" }) {
  const score = data?.fraud_risk_score ?? 0;
  const riskLevel = data?.risk_level ?? "LOW";
  const behavioralStatus = data?.behavioral_status ?? "NORMAL";
  const alerts = data?.alerts ?? [];
  const recommendations = data?.recommendations ?? [];
  const warnings = data?.adaptive_warnings ?? [];
  const patterns = data?.request_patterns ?? [];
  const timeline = data?.risk_timeline ?? [];
  const trustConsistency = data?.trust_consistency;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-300/80">
            Behavioral security intelligence
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
            <ScanEye className="h-6 w-6 text-rose-300" />
            Fraud Detection Console
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Adaptive anomaly detection across request frequency, loan velocity, login timing,
            trust consistency, and transaction volatility — brokered via API gateway with JWT.
          </p>
        </div>
        <span className="fraud-badge inline-flex items-center gap-2 self-start rounded-full border border-rose-500/35 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200">
          <Fingerprint className="h-3.5 w-3.5" />
          Rule-based fraud engine
        </span>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <GlassCard className="fraud-panel-glow xl:col-span-1">
          <header className="mb-4 text-center">
            <h3 className="text-sm font-semibold text-white">Fraud risk indicator</h3>
            <p className="text-xs text-slate-500">Composite behavioral risk index</p>
          </header>
          <FraudRiskIndicator score={score} riskLevel={riskLevel} loading={loading} />
          {!loading && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Status:{" "}
              <span className="font-semibold text-rose-200">
                {statusLabels[behavioralStatus] || behavioralStatus}
              </span>
            </p>
          )}
        </GlassCard>

        <GlassCard className="fraud-panel-glow xl:col-span-2">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">Security alert panel</h3>
            <p className="text-xs text-slate-500">Suspicious activity & anomaly alerts</p>
          </header>
          <SecurityAlertPanel alerts={alerts} loading={loading} />
          {!loading && trustConsistency && (
            <p className="mt-4 rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
              Trust consistency ({trustConsistency.consistency_score}%): {trustConsistency.summary}
            </p>
          )}
        </GlassCard>
      </div>

      <GlassCard className="fraud-panel-glow">
        <header className="mb-4">
          <h3 className="text-sm font-semibold text-white">Behavioral analysis</h3>
          <p className="text-xs text-slate-500">Request pattern dimensions</p>
        </header>
        <BehavioralAnalysisCards patterns={patterns} loading={loading} />
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="fraud-panel-glow">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">Risk timeline</h3>
            <p className="text-xs text-slate-500">Trust score vs fraud risk trajectory</p>
          </header>
          <RiskTimelineWidget timeline={timeline} loading={loading} />
        </GlassCard>

        <GlassCard className="fraud-panel-glow">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">Adaptive security</h3>
            <p className="text-xs text-slate-500">Warnings & mitigation recommendations</p>
          </header>
          <AdaptiveSecurityNotifications
            warnings={warnings}
            recommendations={recommendations}
            loading={loading}
          />
        </GlassCard>
      </div>
    </section>
  );
}
