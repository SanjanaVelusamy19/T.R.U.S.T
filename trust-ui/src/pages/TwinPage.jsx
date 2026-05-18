import { useCallback, useEffect, useState } from "react";
import { DigitalTwinPanel } from "../components/digital-twin/DigitalTwinPanel.jsx";
import { fetchTwinForecast, fetchTwinScenarios } from "../services/twinApi.js";

export function TwinPage() {
  const [forecast, setForecast] = useState(null);
  const [scenarios, setScenarios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeScenario, setActiveScenario] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [forecastData, scenarioData] = await Promise.all([
          fetchTwinForecast(),
          fetchTwinScenarios(),
        ]);
        if (!cancelled) {
          setForecast(forecastData);
          setScenarios(scenarioData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load digital twin simulation. Ensure digital-twin-service is running on port 8007.",
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

  const handleScenarioSelect = useCallback(async (scenarioId) => {
    setActiveScenario(scenarioId);
    setScenarioLoading(true);
    setError("");
    try {
      const data = await fetchTwinForecast(scenarioId);
      setForecast(data);
    } catch (err) {
      setError(err.message || "Scenario simulation failed.");
    } finally {
      setScenarioLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-fuchsia-300/80">
          Future financial modeling
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Financial digital twin</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Explore projected trust scores, savings trajectories, and risk evolution under adaptive
          behavioral scenarios.
        </p>
      </div>
      <DigitalTwinPanel
        forecast={forecast}
        scenarios={scenarios}
        loading={loading}
        scenarioLoading={scenarioLoading}
        error={error}
        activeScenario={activeScenario}
        onScenarioSelect={handleScenarioSelect}
      />
    </div>
  );
}
