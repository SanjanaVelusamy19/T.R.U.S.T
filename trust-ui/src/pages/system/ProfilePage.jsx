import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { GlassCard } from "../../components/GlassCard.jsx";
import { LoadingSpinner } from "../../components/LoadingSpinner.jsx";
import { PageChrome } from "../../components/PageChrome.jsx";
import { FraudRiskIndicator } from "../../components/fraud/FraudRiskIndicator.jsx";
import { TrustScoreCard } from "../../components/trust/TrustScoreCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchAdvisorSummary } from "../../services/advisorApi.js";
import { fetchFraudAnalysis } from "../../services/fraudApi.js";
import { fetchTrustDashboard } from "../../services/trustAnalytics.js";

export function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trust, setTrust] = useState(null);
  const [fraud, setFraud] = useState(null);
  const [advisor, setAdvisor] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, f, a] = await Promise.all([
          fetchTrustDashboard().catch(() => null),
          fetchFraudAnalysis().catch(() => null),
          fetchAdvisorSummary().catch(() => null),
        ]);
        if (!cancelled) {
          setTrust(t);
          setFraud(f);
          setAdvisor(a);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const trustScore = trust?.trust_score ?? trust?.score ?? 0;
  const riskLevel = fraud?.risk_level ?? fraud?.riskLevel ?? "LOW";
  const fraudScore = fraud?.risk_score ?? fraud?.score ?? 0;
  const healthScore = advisor?.financial_health?.score ?? advisor?.health_score;
  const topInsight =
    advisor?.recommendations?.[0]?.summary ||
    advisor?.recommendations?.[0]?.title ||
    "No advisor insights yet.";

  const securityEvents = [
    { label: "JWT session", status: "Active", time: "Now" },
    { label: "Gateway auth", status: "Verified", time: "On login" },
    {
      label: "Fraud posture",
      status: riskLevel,
      time: fraud ? "Live" : "—",
    },
  ];

  if (loading) {
    return (
      <PageChrome
        eyebrow="Identity plane"
        title="Financial Identity Center"
        description="Loading your trust profile and ecosystem signals…"
      >
        <GlassCard>
          <LoadingSpinner label="Composing identity snapshot…" />
        </GlassCard>
      </PageChrome>
    );
  }

  return (
    <PageChrome
      eyebrow="Identity plane"
      title="Financial Identity Center"
      description={`Unified financial identity for ${user?.full_name || "operator"} across the TRUST ecosystem.`}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="flex flex-col items-center lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trust snapshot</p>
          <TrustScoreCard score={Math.round(trustScore)} />
          <p className="mt-2 text-center text-xs text-slate-400">
            {trust?.trend_label || trust?.momentum || "Behavioral stability index"}
          </p>
        </GlassCard>

        <div className="space-y-6 lg:col-span-2">
          <GlassCard>
            <h2 className="text-sm font-semibold text-white">Risk profile</h2>
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
              <FraudRiskIndicator score={fraudScore} riskLevel={riskLevel} />
              <div className="space-y-3 text-sm">
                <Stat label="Trust band" value={trust?.risk_level || "—"} />
                <Stat label="Fraud index" value={fraudScore} />
                <Stat label="Behavioral stability" value={`${trust?.transaction_stability ?? "—"}%`} />
              </div>
            </div>
          </GlassCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <GlassCard>
              <h2 className="text-sm font-semibold text-white">Financial behavior</h2>
              <ul className="mt-4 space-y-2 text-xs text-slate-400">
                <li>Repayment history: {trust?.repayment_history ?? "—"}</li>
                <li>Savings consistency: {trust?.savings_consistency ?? "—"}</li>
                <li>Credit posture: {trust?.credit_score ?? "—"}</li>
              </ul>
            </GlassCard>
            <GlassCard>
              <h2 className="text-sm font-semibold text-white">Ecosystem usage</h2>
              <ul className="mt-4 space-y-2 text-xs text-slate-400">
                <li>Modules active: Intelligence, Security, Finance</li>
                <li>Advisor health: {healthScore != null ? Math.round(healthScore) : "—"}</li>
                <li>Session: {user?.email}</li>
              </ul>
            </GlassCard>
          </div>

          <GlassCard className="advisor-panel-glow">
            <h2 className="text-sm font-semibold text-white">AI insight summary</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{topInsight}</p>
          </GlassCard>

          <GlassCard>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Security status timeline
            </h2>
            <ol className="space-y-3 border-l border-emerald-500/20 pl-4">
              {securityEvents.map((evt) => (
                <li key={evt.label} className="relative">
                  <span className="absolute -left-[1.15rem] top-1.5 h-2 w-2 rounded-full bg-emerald-400" />
                  <p className="text-xs font-medium text-slate-200">{evt.label}</p>
                  <p className="text-[10px] text-slate-500">
                    {evt.status} · {evt.time}
                  </p>
                </li>
              ))}
            </ol>
          </GlassCard>
        </div>
      </div>
    </PageChrome>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
