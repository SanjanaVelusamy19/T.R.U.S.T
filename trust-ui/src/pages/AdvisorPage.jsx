import { useEffect, useState } from "react";
import { AIAdvisorPanel } from "../components/advisor/AIAdvisorPanel.jsx";
import { PageChrome } from "../components/PageChrome.jsx";
import { fetchAdvisorSummary } from "../services/advisorApi.js";

export function AdvisorPage() {
  const [advisor, setAdvisor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchAdvisorSummary();
        if (!cancelled) setAdvisor(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageChrome
      eyebrow="Intelligence module"
      title="AI Financial Advisor"
      description="Personalized recommendations and risk analysis from the advisor microservice."
    >
      <AIAdvisorPanel data={advisor} loading={loading} error={error} />
    </PageChrome>
  );
}
