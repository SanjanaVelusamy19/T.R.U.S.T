import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { DashboardSection } from "../components/dashboard/DashboardSection.jsx";
import { useAuth } from "../context/AuthContext.jsx";

import { fetchAdvisorSummary } from "../services/advisorApi.js";
import { fetchFraudAnalysis } from "../services/fraudApi.js";

import {
  fetchMonitoringMetrics,
  fetchMonitoringServicesStatus,
  fetchMonitoringSystemStatus,
} from "../services/monitoringApi.js";

import { fetchTwinForecast } from "../services/twinApi.js";
import { fetchTrustDashboard } from "../services/trustAnalytics.js";

import { AdvisorWidget } from "../widgets/AdvisorWidget.jsx";
import { DigitalTwinWidget } from "../widgets/DigitalTwinWidget.jsx";
import { EcosystemHealthWidget } from "../widgets/EcosystemHealthWidget.jsx";
import { ForecastWidget } from "../widgets/ForecastWidget.jsx";
import { FraudWidget } from "../widgets/FraudWidget.jsx";
import { LoanWidget } from "../widgets/LoanWidget.jsx";
import { MonitorWidget } from "../widgets/MonitorWidget.jsx";
import { TrustWidget } from "../widgets/TrustWidget.jsx";

export function CommandCenter() {
  const { user } = useAuth();

  const [trust, setTrust] = useState({
    data: null,
    loading: true,
    error: "",
  });

  const [fraud, setFraud] = useState({
    data: null,
    loading: true,
    error: "",
  });

  const [advisor, setAdvisor] = useState({
    data: null,
    loading: true,
    error: "",
  });

  const [twin, setTwin] = useState({
    data: null,
    loading: true,
    error: "",
  });

  const [monitor, setMonitor] = useState({
    metrics: null,
    system: null,
    services: null,
    loading: true,
    error: "",
  });

  // =========================
  // TRUST DASHBOARD (FAST LOAD)
  // =========================
  useEffect(() => {
    let cancelled = false;

    const loadTrust = async () => {
      try {
        const data = await fetchTrustDashboard();

        if (!cancelled) {
          setTrust({
            data,
            loading: false,
            error: "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setTrust({
            data: null,
            loading: false,
            error: err.message,
          });
        }
      }
    };

    loadTrust();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================
  // FRAUD (DELAYED LOAD)
  // =========================
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const data = await fetchFraudAnalysis();

        if (!cancelled) {
          setFraud({
            data,
            loading: false,
            error: "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setFraud({
            data: null,
            loading: false,
            error: err.message,
          });
        }
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // =========================
  // ADVISOR (DELAYED LOAD)
  // =========================
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const data = await fetchAdvisorSummary();

        if (!cancelled) {
          setAdvisor({
            data,
            loading: false,
            error: "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setAdvisor({
            data: null,
            loading: false,
            error: err.message,
          });
        }
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // =========================
  // DIGITAL TWIN (DELAYED LOAD)
  // =========================
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const data = await fetchTwinForecast();

        if (!cancelled) {
          setTwin({
            data,
            loading: false,
            error: "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setTwin({
            data: null,
            loading: false,
            error: err.message,
          });
        }
      }
    }, 4000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // =========================
  // MONITORING (HEAVY LOAD DELAYED)
  // =========================
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const [metrics, system, services] = await Promise.all([
          fetchMonitoringMetrics(),
          fetchMonitoringSystemStatus(),
          fetchMonitoringServicesStatus(),
        ]);

        if (!cancelled) {
          setMonitor({
            metrics,
            system,
            services,
            loading: false,
            error: "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setMonitor({
            metrics: null,
            system: null,
            services: null,
            loading: false,
            error: err.message,
          });
        }
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1600px] space-y-10 pb-4">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 border-b border-slate-800/50 pb-6 lg:flex-row lg:items-end"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-400/80">
            Adaptive Intelligent Fintech Command Center
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Welcome back,{" "}
            {user?.full_name?.split(" ")[0] || "operator"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Unified intelligence workspace — press{" "}
            <kbd className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
              Ctrl+K
            </kbd>{" "}
            to navigate the ecosystem.
          </p>
        </div>

        <Link
          to="/trust"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-fuchsia-500/90 to-cyan-400/90 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.2)] transition hover:brightness-110"
        >
          <Sparkles className="h-4 w-4" />
          Run live scoring
        </Link>
      </motion.header>

      <div className="space-y-10">
        <DashboardSection
          title="Intelligence core"
          subtitle="Trust index and AI-driven financial guidance"
          columns="sm:grid-cols-2"
        >
          <TrustWidget
            data={trust.data}
            loading={trust.loading}
            error={trust.error}
          />

          <AdvisorWidget
            data={advisor.data}
            loading={advisor.loading}
            error={advisor.error}
          />
        </DashboardSection>

        <DashboardSection
          title="Security & operations"
          subtitle="Fraud surface, ecosystem health, and infrastructure"
          columns="sm:grid-cols-2 xl:grid-cols-3"
        >
          <FraudWidget
            data={fraud.data}
            loading={fraud.loading}
            error={fraud.error}
          />

          <EcosystemHealthWidget
            systemStatus={monitor.system}
            services={monitor.services}
            loading={monitor.loading}
            error={monitor.error}
          />

          <MonitorWidget
            metrics={monitor.metrics}
            services={monitor.services}
            loading={monitor.loading}
            error={monitor.error}
          />
        </DashboardSection>

        <DashboardSection
          title="Financial modeling"
          subtitle="Lending desks and digital twin projections"
          columns="sm:grid-cols-2 xl:grid-cols-3"
        >
          <LoanWidget />

          <DigitalTwinWidget
            data={twin.data}
            loading={twin.loading}
            error={twin.error}
          />

          <div className="sm:col-span-2 xl:col-span-1">
            <ForecastWidget
              data={twin.data}
              loading={twin.loading}
              error={twin.error}
            />
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}