const riskClass = {
  LOW: "border-emerald-500/35 text-emerald-300",
  MEDIUM: "border-amber-500/35 text-amber-300",
  HIGH: "border-rose-500/40 text-rose-300",
};

const healthClass = {
  IMPROVING: "text-emerald-300",
  STABLE: "text-cyan-300",
  DECLINING: "text-rose-300",
};

export function ScenarioCards({ scenarios = [], recommended, activeScenario, onSelect, loading = false }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {scenarios.map((s) => {
        const active = activeScenario === s.id;
        const isRec = recommended === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect?.(s.id)}
            className={`twin-scenario-card insight-card rounded-xl border bg-slate-900/40 p-4 text-left transition ${
              active
                ? "border-fuchsia-500/50 shadow-[0_0_24px_rgba(232,121,249,0.15)]"
                : "border-slate-700/60 hover:border-fuchsia-500/30"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-white">{s.title}</p>
              {isRec ? (
                <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase text-fuchsia-200">
                  Best
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-400">{s.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-violet-500/30 px-2 py-0.5 text-[10px] font-semibold text-violet-200">
                Trust → {s.projected_trust_score}
              </span>
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${riskClass[s.risk_projection] || riskClass.MEDIUM}`}
              >
                {s.risk_projection}
              </span>
              <span className={`text-[10px] font-medium ${healthClass[s.health_forecast] || "text-slate-400"}`}>
                {s.health_forecast}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
