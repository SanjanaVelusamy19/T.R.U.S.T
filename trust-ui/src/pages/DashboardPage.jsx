import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowUpRight, Coins, Gauge, Orbit, Radar, ScanEye, ShieldCheck, Sparkles } from "lucide-react";
import { AIAdvisorPanel } from "../components/advisor/AIAdvisorPanel.jsx";
import { TrustGraphDashboard } from "../components/analytics/TrustGraphDashboard.jsx";
import { DigitalTwinPanel } from "../components/digital-twin/DigitalTwinPanel.jsx";
import { FraudSecurityPanel } from "../components/fraud/FraudSecurityPanel.jsx";
import { GlassCard } from "../components/GlassCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchAdvisorSummary } from "../services/advisorApi.js";
import { fetchFraudAnalysis } from "../services/fraudApi.js";
import { fetchTwinForecast, fetchTwinScenarios } from "../services/twinApi.js";
import { fetchTrustDashboard } from "../services/trustAnalytics.js";

export function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [advisor, setAdvisor] = useState(null);
  const [advisorLoading, setAdvisorLoading] = useState(true);
  const [advisorError, setAdvisorError] = useState("");
  const [fraud, setFraud] = useState(null);
  const [fraudLoading, setFraudLoading] = useState(true);
  const [fraudError, setFraudError] = useState("");
  const [twin, setTwin] = useState(null);
  const [twinScenarios, setTwinScenarios] = useState(null);
  const [twinLoading, setTwinLoading] = useState(true);
  const [twinScenarioLoading, setTwinScenarioLoading] = useState(false);
  const [twinError, setTwinError] = useState("");
  const [activeTwinScenario, setActiveTwinScenario] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchTrustDashboard();
        if (!cancelled) setAnalytics(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load trust graph analytics. Ensure the gateway and trust service are running.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAdvisor() {
      setAdvisorLoading(true);
      setAdvisorError("");
      try {
        const data = await fetchAdvisorSummary();
        if (!cancelled) setAdvisor(data);
      } catch (err) {
        if (!cancelled) {
          setAdvisorError(
            err.message ||
              "Unable to load AI advisor insights. Ensure advisor-service is running on port 8004.",
          );
        }
      } finally {
        if (!cancelled) setAdvisorLoading(false);
      }
    }

    loadAdvisor();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFraud() {
      setFraudLoading(true);
      setFraudError("");
      try {
        const data = await fetchFraudAnalysis();
        if (!cancelled) setFraud(data);
      } catch (err) {
        if (!cancelled) {
          setFraudError(
            err.message ||
              "Unable to load fraud detection insights. Ensure fraud-detection-service is running on port 8005.",
          );
        }
      } finally {
        if (!cancelled) setFraudLoading(false);
      }
    }

    loadFraud();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTwin() {
      setTwinLoading(true);
      setTwinError("");
      try {
        const [forecastData, scenarioData] = await Promise.all([
          fetchTwinForecast(),
          fetchTwinScenarios(),
        ]);
        if (!cancelled) {
          setTwin(forecastData);
          setTwinScenarios(scenarioData);
        }
      } catch (err) {
        if (!cancelled) {
          setTwinError(
            err.message ||
              "Unable to load digital twin forecast. Ensure digital-twin-service is running on port 8007.",
          );
        }
      } finally {
        if (!cancelled) setTwinLoading(false);
      }
    }

    loadTwin();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleTwinScenario(scenarioId) {
    setActiveTwinScenario(scenarioId);
    setTwinScenarioLoading(true);
    setTwinError("");
    try {
      const data = await fetchTwinForecast(scenarioId);
      setTwin(data);
    } catch (err) {
      setTwinError(err.message || "Scenario simulation failed.");
    } finally {
      setTwinScenarioLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
            Financial intelligence console
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Good day, {user?.full_name?.split(" ")[0] || "operator"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            TRUST graph analytics visualize behavioral stability, risk heat, and adaptive
            trust momentum — all brokered through the API gateway with JWT enforcement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <Link
            to="/trust"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500/90 to-cyan-400/90 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.3)] transition hover:brightness-110"
          >
            <Sparkles className="h-4 w-4" />
            Run live scoring
          </Link>
          <Link
            to="/loan"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900/70 px-4 py-2 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-500/40 hover:bg-slate-900"
          >
            Launch loan desk
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            to="/gold-loan"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 px-4 py-2 text-sm font-semibold text-amber-100 ring-1 ring-amber-500/40 hover:brightness-110"
          >
            <Coins className="h-4 w-4" />
            Gold loan desk
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <GlassCard className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Identity plane
              </p>
              <p className="mt-2 text-lg font-semibold text-white">Auth microservice</p>
              <p className="mt-1 text-xs text-slate-400">JWT issuance & verification</p>
            </div>
            <ShieldCheck className="h-9 w-9 text-cyan-300" />
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-fuchsia-500/20 blur-2xl" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Credit surface
              </p>
              <p className="mt-2 text-lg font-semibold text-white">Loan engine</p>
              <p className="mt-1 text-xs text-slate-400">Explainable eligibility</p>
            </div>
            <Gauge className="h-9 w-9 text-fuchsia-300" />
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Trust graph
              </p>
              <p className="mt-2 text-lg font-semibold text-white">Analytics engine</p>
              <p className="mt-1 text-xs text-slate-400">Timeline, radar & risk heat</p>
            </div>
            <Radar className="h-9 w-9 text-violet-300" />
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-400/15 blur-2xl" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Edge control
              </p>
              <p className="mt-2 text-lg font-semibold text-white">Gateway policies</p>
              <p className="mt-1 text-xs text-slate-400">Rate limits & structured logs</p>
            </div>
            <Activity className="h-9 w-9 text-emerald-300" />
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-500/20 blur-2xl" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Behavioral security
              </p>
              <p className="mt-2 text-lg font-semibold text-white">Fraud detection</p>
              <p className="mt-1 text-xs text-slate-400">Anomaly & adaptive risk</p>
            </div>
            <ScanEye className="h-9 w-9 text-rose-300" />
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-fuchsia-500/25 blur-2xl" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Future modeling
              </p>
              <p className="mt-2 text-lg font-semibold text-white">Digital twin</p>
              <p className="mt-1 text-xs text-slate-400">Trust & savings forecast</p>
            </div>
            <Orbit className="h-9 w-9 text-fuchsia-300" />
          </div>
        </GlassCard>

        <Link to="/gold-loan" className="block">
          <GlassCard className="gold-loan-panel relative h-full overflow-hidden transition hover:border-amber-400/40">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-400/25 blur-2xl" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Collateral lending
                </p>
                <p className="mt-2 text-lg font-semibold text-white">Gold loan engine</p>
                <p className="mt-1 text-xs text-slate-400">Valuation & trust-aware limits</p>
              </div>
              <Coins className="h-9 w-9 text-amber-300" />
            </div>
          </GlassCard>
        </Link>
      </div>

      <AIAdvisorPanel data={advisor} loading={advisorLoading} error={advisorError} />

      <FraudSecurityPanel data={fraud} loading={fraudLoading} error={fraudError} />

      <DigitalTwinPanel
        forecast={twin}
        scenarios={twinScenarios}
        loading={twinLoading}
        scenarioLoading={twinScenarioLoading}
        error={twinError}
        activeScenario={activeTwinScenario}
        onScenarioSelect={handleTwinScenario}
      />

      <TrustGraphDashboard data={analytics} loading={loading} error={error} showScore />

      <GlassCard>
        <h2 className="text-sm font-semibold text-white">Active session</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Operator</dt>
            <dd className="mt-1 font-medium text-slate-100">{user?.full_name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 font-mono text-xs text-cyan-100">{user?.email}</dd>
          </div>
        </dl>
      </GlassCard>
    </div>
  );
}
