import { useEffect, useState } from "react";
import { MonitoringDashboard } from "../components/monitoring/MonitoringDashboard.jsx";
import {
  fetchMonitoringMetrics,
  fetchMonitoringServicesStatus,
  fetchMonitoringSystemStatus,
} from "../services/monitoringApi.js";

export function MonitoringPage() {
  const [metrics, setMetrics] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [servicesStatus, setServicesStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [metricsData, systemData, servicesData] = await Promise.all([
          fetchMonitoringMetrics(),
          fetchMonitoringSystemStatus(),
          fetchMonitoringServicesStatus(),
        ]);
        if (!cancelled) {
          setMetrics(metricsData);
          setSystemStatus(systemData);
          setServicesStatus(servicesData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load system monitoring. Ensure the gateway and monitoring-service are running on port 8006.",
          );
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
          Infrastructure observability
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">System monitoring</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Live CPU, memory, disk utilization and service health indicators from the TRUST monitoring
          microservice.
        </p>
      </div>
      <MonitoringDashboard
        metrics={metrics}
        systemStatus={systemStatus}
        servicesStatus={servicesStatus}
        loading={loading}
        error={error}
      />
    </div>
  );
}
