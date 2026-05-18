import { useEffect, useState } from "react";
import { FraudSecurityPanel } from "../components/fraud/FraudSecurityPanel.jsx";
import { fetchFraudAnalysis } from "../services/fraudApi.js";

export function SecurityPage() {
  const [fraud, setFraud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchFraudAnalysis();
        if (!cancelled) setFraud(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load behavioral fraud intelligence. Ensure the gateway and fraud service are running.",
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
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-300/80">
          Adaptive fintech security
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
          Behavioral fraud intelligence
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Real-time anomaly scoring, trust consistency evaluation, and adaptive risk warnings
          powered by deterministic rule-based reasoning.
        </p>
      </div>
      <FraudSecurityPanel data={fraud} loading={loading} error={error} />
    </div>
  );
}
