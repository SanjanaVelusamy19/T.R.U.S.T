import { Orbit, Sparkles } from "lucide-react";
import { GlassCard } from "../GlassCard.jsx";
import { RiskProjectionTimeline } from "./RiskProjectionTimeline.jsx";
import { SavingsForecastWidget } from "./SavingsForecastWidget.jsx";
import { ScenarioCards } from "./ScenarioCards.jsx";
import { TrustEvolutionChart } from "./TrustEvolutionChart.jsx";

const healthLabels = { IMPROVING: "Improving", STABLE: "Stable", DECLINING: "Declining" };

export function DigitalTwinPanel({
  forecast,
  scenarios,
  loading = false,
  scenarioLoading = false,
  error = "",
  activeScenario,
  onScenarioSelect,
}) {
  const current = forecast?.current_trust_score ?? 0;
  const projected = forecast?.projected_trust_score ?? 0;
  const delta = projected - current;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-fuchsia-300/80">
            Predictive financial intelligence
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
            <Orbit className="h-6 w-6 text-fuchsia-300 twin-orbit-icon" />
            Financial Digital Twin
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Virtual future model simulating trust evolution, savings growth, spending patterns,
            and risk trajectories — deterministic forecasting via the API gateway.
          </p>
        </div>
        <span className="twin-badge inline-flex items-center gap-2 self-start rounded-full border border-fuchsia-500/35 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-200">
          <Sparkles className="h-3.5 w-3.5" />
          Adaptive simulation engine
        </span>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <GlassCard className="twin-panel-glow">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Trust projection ({forecast?.projection_period_months ?? 6} mo)
            </p>
            {loading ? (
              <div className="mt-2 h-12 w-48 animate-pulse rounded bg-slate-800/60" />
            ) : (
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-4xl font-bold tabular-nums text-white">{current}</span>
                <span className="text-fuchsia-300">→</span>
                <span className="text-4xl font-bold tabular-nums text-fuchsia-200">{projected}</span>
                <span
                  className={`text-sm font-semibold ${delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}
                >
                  {delta >= 0 ? "+" : ""}
                  {delta}
                </span>
              </div>
            )}
          </div>
          {!loading && forecast && (
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[10px] uppercase text-slate-500">Health</dt>
                <dd className="font-semibold text-cyan-200">
                  {healthLabels[forecast.financial_health_forecast] ?? forecast.financial_health_forecast}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-slate-500">Risk</dt>
                <dd className="font-semibold text-rose-200">{forecast.risk_projection}</dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-[10px] uppercase text-slate-500">Scenario</dt>
                <dd className="truncate font-mono text-xs text-violet-200">{forecast.active_scenario}</dd>
              </div>
            </dl>
          )}
        </div>
        {!loading && forecast?.simulation_summary && (
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{forecast.simulation_summary}</p>
        )}
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="twin-panel-glow">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">Trust evolution</h3>
            <p className="text-xs text-slate-500">Projected trust & health trajectory</p>
          </header>
          <TrustEvolutionChart
            timeline={forecast?.trust_timeline ?? []}
            currentScore={current}
            loading={loading || scenarioLoading}
          />
        </GlassCard>

        <GlassCard className="twin-panel-glow">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">Risk projection</h3>
            <p className="text-xs text-slate-500">Future risk index timeline</p>
          </header>
          <RiskProjectionTimeline timeline={forecast?.risk_timeline ?? []} loading={loading || scenarioLoading} />
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="twin-panel-glow">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">Savings forecast</h3>
            <p className="text-xs text-slate-500">Growth index projection</p>
          </header>
          <SavingsForecastWidget
            forecast={forecast?.savings_forecast ?? []}
            current={forecast?.savings_forecast?.[0]?.savings_index ?? current * 0.9}
            projected={
              forecast?.savings_forecast?.[forecast.savings_forecast.length - 1]?.savings_index ?? projected * 0.9
            }
            loading={loading || scenarioLoading}
          />
        </GlassCard>

        <GlassCard className="twin-panel-glow">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-white">Recommendations</h3>
            <p className="text-xs text-slate-500">Adaptive financial guidance</p>
          </header>
          {loading ? (
            <ul className="space-y-2">
              {[1, 2].map((i) => (
                <li key={i} className="h-10 animate-pulse rounded-lg bg-slate-800/50" />
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              {(forecast?.recommendations ?? []).map((rec) => (
                <li
                  key={rec}
                  className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-50/90"
                >
                  {rec}
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      <GlassCard className="twin-panel-glow">
        <header className="mb-4">
          <h3 className="text-sm font-semibold text-white">Adaptive simulation scenarios</h3>
          <p className="text-xs text-slate-500">Select a behavioral model to re-run the twin forecast</p>
        </header>
        <ScenarioCards
          scenarios={scenarios?.scenarios ?? []}
          recommended={scenarios?.recommended_scenario}
          activeScenario={activeScenario}
          onSelect={onScenarioSelect}
          loading={loading && !scenarios}
        />
      </GlassCard>
    </section>
  );
}
