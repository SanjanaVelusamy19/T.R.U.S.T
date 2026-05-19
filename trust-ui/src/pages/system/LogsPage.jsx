import { Activity } from "lucide-react";
import { GlassCard } from "../../components/GlassCard.jsx";
import { PageChrome } from "../../components/PageChrome.jsx";
import { EventTimeline } from "../../components/ui/EventTimeline.jsx";
import { useEcosystemEvents } from "../../hooks/useEcosystemEvents.js";

export function LogsPage() {
  const { events, loading } = useEcosystemEvents();

  const counts = events.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <PageChrome
      eyebrow="System observability"
      title="Ecosystem Event Timeline"
      description="Unified stream of gateway, security, trust, advisor, and authentication activity across the TRUST mesh."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(counts).map(([cat, count]) => (
          <span
            key={cat}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-400"
          >
            <Activity className="h-3 w-3" />
            {cat} · {count}
          </span>
        ))}
      </div>
      <GlassCard>
        <EventTimeline events={events} loading={loading} />
      </GlassCard>
    </PageChrome>
  );
}
