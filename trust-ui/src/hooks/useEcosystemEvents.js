import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchAdvisorSummary } from "../services/advisorApi.js";
import { fetchFraudAlerts, fetchFraudAnalysis } from "../services/fraudApi.js";
import {
  fetchMonitoringServicesStatus,
  fetchMonitoringSystemStatus,
} from "../services/monitoringApi.js";
import { fetchTrustDashboard } from "../services/trustAnalytics.js";

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

let eventId = 0;
function makeEvent(partial) {
  eventId += 1;
  return { id: `evt-${eventId}`, time: formatTime(), ...partial };
}

export function useEcosystemEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const collected = [];

      collected.push(
        makeEvent({
          category: "auth",
          title: "Session validated",
          message: `Operator ${user?.full_name || "unknown"} authenticated via JWT gateway.`,
          meta: user?.email,
          pulse: true,
        }),
      );

      collected.push(
        makeEvent({
          category: "gateway",
          title: "Gateway route active",
          message: "API requests routed through TRUST gateway with bearer token enforcement.",
          meta: import.meta.env.VITE_API_URL || "http://localhost:8000",
        }),
      );

      await Promise.allSettled([
        fetchTrustDashboard()
          .then((data) => {
            const score = data?.trust_score ?? data?.score;
            if (score != null) {
              collected.push(
                makeEvent({
                  category: "trust",
                  title: "Trust index synchronized",
                  message: `Analytics dashboard snapshot loaded. Score: ${Math.round(score)}.`,
                  meta: data?.risk_level ? `Risk: ${data.risk_level}` : undefined,
                }),
              );
            }
          })
          .catch(() => {}),
        fetchFraudAnalysis()
          .then((data) => {
            collected.push(
              makeEvent({
                category: "fraud",
                title: "Fraud analysis completed",
                message: `Behavioral risk level: ${data?.risk_level || data?.riskLevel || "LOW"}.`,
                meta: data?.risk_score != null ? `Index: ${data.risk_score}` : undefined,
              }),
            );
          })
          .catch(() => {}),
        fetchFraudAlerts()
          .then((data) => {
            const alerts = data?.alerts || (Array.isArray(data) ? data : []);
            alerts.slice(0, 3).forEach((alert) => {
              collected.push(
                makeEvent({
                  category: "fraud",
                  title: alert?.title || "Fraud alert",
                  message: alert?.message || alert?.description || "Security signal detected.",
                  meta: alert?.severity,
                }),
              );
            });
          })
          .catch(() => {}),
        fetchAdvisorSummary()
          .then((data) => {
            const rec = data?.recommendations?.[0];
            if (rec) {
              collected.push(
                makeEvent({
                  category: "advisor",
                  title: "Advisor recommendation",
                  message: rec.summary || rec.title || rec.message || "New financial insight available.",
                }),
              );
            }
          })
          .catch(() => {}),
        fetchMonitoringSystemStatus()
          .then((data) => {
            collected.push(
              makeEvent({
                category: "monitoring",
                title: "System status poll",
                message: data?.summary || `Platform status: ${data?.status || "unknown"}.`,
                meta: data?.timestamp,
              }),
            );
          })
          .catch(() => {}),
        fetchMonitoringServicesStatus()
          .then((data) => {
            const services = data?.services ?? [];
            services.slice(0, 4).forEach((svc) => {
              collected.push(
                makeEvent({
                  category: "gateway",
                  title: `Service heartbeat: ${svc.name || svc.service}`,
                  message: svc.detail || `${svc.metric || "status"}: ${svc.value ?? svc.status}`,
                  meta: `status: ${svc.status}`,
                  pulse: String(svc.status).toUpperCase() === "HEALTHY",
                }),
              );
            });
          })
          .catch(() => {}),
      ]);

      if (!cancelled) {
        setEvents(collected.reverse());
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.email, user?.full_name]);

  return { events, loading };
}
