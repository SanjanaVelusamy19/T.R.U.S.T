import { useEffect } from "react";
import { useNotifications } from "../context/NotificationContext.jsx";
import { usePreferences } from "../context/PreferencesContext.jsx";
import { fetchAdvisorSummary } from "../services/advisorApi.js";
import { fetchFraudAlerts, fetchFraudAnalysis } from "../services/fraudApi.js";
import { fetchMonitoringSystemStatus } from "../services/monitoringApi.js";
import { fetchTrustDashboard } from "../services/trustAnalytics.js";

/**
 * Seeds the notification center from live gateway APIs (read-only).
 * Respects user notification preferences from Settings.
 */
export function useEcosystemSignals() {
  const { push } = useNotifications();
  const { prefs } = usePreferences();

  useEffect(() => {
    let cancelled = false;
    const { notifications: n } = prefs;

    async function load() {
      const tasks = [];

      if (n.trust) {
        tasks.push(
          fetchTrustDashboard()
            .then((data) => {
              if (cancelled) return;
              const score = data?.trust_score ?? data?.score;
              if (score != null) {
                push({
                  title: "Trust index updated",
                  message: `Current trust score: ${Math.round(score)}`,
                  tone: score >= 70 ? "success" : "warning",
                  source: "trust",
                });
              }
            })
            .catch(() => {}),
        );
      }

      if (n.fraud) {
        tasks.push(
          fetchFraudAnalysis()
            .then((data) => {
              if (cancelled) return;
              const level = data?.risk_level || data?.riskLevel;
              if (level && String(level).toUpperCase() !== "LOW") {
                push({
                  title: "Fraud risk elevated",
                  message: `Behavioral risk level: ${level}`,
                  tone: "alert",
                  source: "fraud",
                });
              }
            })
            .catch(() => {}),
          fetchFraudAlerts()
            .then((data) => {
              if (cancelled) return;
              const alerts = data?.alerts || data || [];
              const first = Array.isArray(alerts) ? alerts[0] : null;
              if (first?.message || first?.title) {
                push({
                  title: first.title || "Security alert",
                  message: first.message || String(first.severity || "Review required"),
                  tone: "alert",
                  source: "fraud",
                });
              }
            })
            .catch(() => {}),
        );
      }

      if (n.advisor) {
        tasks.push(
          fetchAdvisorSummary()
            .then((data) => {
              if (cancelled) return;
              const rec = data?.recommendations?.[0] || data?.top_recommendation;
              const text = rec?.summary || rec?.title || rec?.message;
              if (text) {
                push({
                  title: "AI advisor insight",
                  message: text,
                  tone: "info",
                  source: "advisor",
                });
              }
            })
            .catch(() => {}),
        );
      }

      if (n.monitoring) {
        tasks.push(
          fetchMonitoringSystemStatus()
            .then((data) => {
              if (cancelled) return;
              const status = String(data?.status || data?.overall_status || "").toUpperCase();
              if (status && status !== "HEALTHY" && status !== "OK") {
                push({
                  title: "System monitoring warning",
                  message: `Infrastructure status: ${status}`,
                  tone: "warning",
                  source: "monitoring",
                });
              }
            })
            .catch(() => {}),
        );
      }

      await Promise.allSettled(tasks);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [push, prefs.notifications]);
}
