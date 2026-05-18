import { useEffect, useState } from "react";
import { MonitoringInfrastructurePanel } from "../components/monitoring/MonitoringInfrastructurePanel.jsx";
import { fetchMonitorSystemHealth } from "../services/monitorApi.js";

export function MonitoringPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const payload = await fetchMonitorSystemHealth();
        if (!cancelled) setData(payload);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load monitoring data. Ensure monitoring-service is running on port 8006.",
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
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300/80">
          Infrastructure observability
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
          Self-healing monitoring
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Enterprise-style health aggregation, latency baselines, and recovery telemetry for the
          full TRUST mesh — served only via the authenticated gateway.
        </p>
      </div>
      <MonitoringInfrastructurePanel data={data} loading={loading} error={error} />
    </div>
  );
}
