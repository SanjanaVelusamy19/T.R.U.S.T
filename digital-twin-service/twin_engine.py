"""
Rule-based financial digital twin simulation engine.

Deterministic forecasting over trust evolution, savings, spending, loan risk,
and health trajectories — no external AI APIs.
"""

from __future__ import annotations

from dataclasses import dataclass

from config import get_settings
from models import (
    FinancialScenario,
    HealthForecast,
    RiskPoint,
    RiskProjection,
    RiskSimulationResponse,
    SavingsGrowthResponse,
    SavingsPoint,
    ScenarioId,
    ScenariosResponse,
    TimelinePoint,
    TrustProjectionResponse,
    TwinForecastResponse,
)
from signals import MONTH_LABELS, TwinBaseline


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _risk_from_index(index: float) -> RiskProjection:
    if index >= 62:
        return RiskProjection.HIGH
    if index >= 38:
        return RiskProjection.MEDIUM
    return RiskProjection.LOW


def _health_from_delta(delta: float) -> HealthForecast:
    if delta >= 4:
        return HealthForecast.IMPROVING
    if delta <= -4:
        return HealthForecast.DECLINING
    return HealthForecast.STABLE


@dataclass(frozen=True)
class ScenarioModifiers:
    trust_delta: float
    savings_delta: float
    spending_delta: float
    risk_delta: float
    repayment_delta: float
    salary_delta: float


SCENARIO_MODIFIERS: dict[ScenarioId, ScenarioModifiers] = {
    ScenarioId.INCREASED_SAVINGS: ScenarioModifiers(6, 18, -2, -8, 2, 0),
    ScenarioId.REDUCED_SPENDING: ScenarioModifiers(4, 8, 12, -6, 1, 0),
    ScenarioId.ADDITIONAL_LOAN: ScenarioModifiers(-5, -4, -6, 14, -3, 0),
    ScenarioId.STABLE_REPAYMENT: ScenarioModifiers(3, 2, 1, -4, 8, 0),
    ScenarioId.RISKY_BEHAVIOR: ScenarioModifiers(-12, -10, -14, 22, -8, -2),
    ScenarioId.IMPROVED_INCOME: ScenarioModifiers(7, 6, 4, -5, 3, 12),
}


def _month_labels(count: int, offset: int = 0) -> list[str]:
    return [MONTH_LABELS[(offset + i) % 12] for i in range(count)]


def _simulate_trajectory(
    baseline: TwinBaseline,
    months: int,
    modifiers: ScenarioModifiers | None = None,
) -> tuple[list[TimelinePoint], list[SavingsPoint], list[RiskPoint], int, float]:
    mod = modifiers or ScenarioModifiers(0, 0, 0, 0, 0, 0)
    labels = _month_labels(months, offset=6)

    trust = float(baseline.trust_score)
    savings = baseline.savings_discipline + mod.savings_delta * 0.15
    spending = baseline.spending_stability + mod.spending_delta * 0.1
    repayment = baseline.repayment_strength + mod.repayment_delta * 0.1
    salary = baseline.salary_stability + mod.salary_delta * 0.1

    momentum = (baseline.trust_momentum - baseline.trust_score) * 0.35
    trust_step = (momentum + mod.trust_delta * 0.12 + repayment * 0.04 + savings * 0.03) / max(1, months)

    timeline: list[TimelinePoint] = []
    savings_series: list[SavingsPoint] = []
    risk_series: list[RiskPoint] = []

    prev_savings = savings
    for i, label in enumerate(labels):
        trust = _clamp(trust + trust_step + (i * 0.15))
        savings = _clamp(savings + (mod.savings_delta * 0.08) + (repayment * 0.02))
        spending = _clamp(spending + (mod.spending_delta * 0.05))
        risk_index = _clamp(
            50
            - savings * 0.22
            - spending * 0.12
            - repayment * 0.18
            + mod.risk_delta * 0.15
            + (100 - trust) * 0.08,
        )
        health_index = _clamp(
            (trust * 0.35 + savings * 0.25 + spending * 0.15 + repayment * 0.25),
        )
        growth = round(((savings - prev_savings) / max(prev_savings, 1)) * 100, 2) if i else 0.0
        prev_savings = savings

        timeline.append(
            TimelinePoint(
                month=label,
                trust_score=int(round(trust)),
                savings_index=round(savings, 1),
                spending_index=round(spending, 1),
                risk_index=round(risk_index, 1),
                health_index=round(health_index, 1),
            )
        )
        savings_series.append(
            SavingsPoint(month=label, savings_index=round(savings, 1), growth_rate_pct=growth)
        )
        risk_series.append(
            RiskPoint(
                month=label,
                risk_index=round(risk_index, 1),
                risk_level=_risk_from_index(risk_index),
            )
        )

    projected_trust = int(timeline[-1].trust_score) if timeline else baseline.trust_score
    health_delta = (timeline[-1].health_index - timeline[0].health_index) if timeline else 0.0
    return timeline, savings_series, risk_series, projected_trust, health_delta


def _recommendations(baseline: TwinBaseline, projected_trust: int, risk: RiskProjection) -> list[str]:
    recs: list[str] = []
    if baseline.savings_discipline < 78:
        recs.append("Increase savings by 15% monthly.")
    if baseline.repayment_strength >= 70:
        recs.append("Maintain current repayment behavior.")
    if projected_trust < baseline.trust_score:
        recs.append("Reduce discretionary spending to stabilize trust trajectory.")
    if risk == RiskProjection.HIGH:
        recs.append("Defer additional loan utilization until risk band improves.")
    if baseline.spending_stability < 72:
        recs.append("Smooth transaction volatility with automated budgeting caps.")
    if not recs:
        recs.append("Continue current financial discipline to preserve premium trust positioning.")
    return recs


def _simulation_summary(baseline: TwinBaseline, projected: int, health: HealthForecast) -> str:
    delta = projected - baseline.trust_score
    if health == HealthForecast.IMPROVING and delta >= 5:
        return (
            "Savings consistency improvements may significantly strengthen financial stability "
            "and elevate institutional trust positioning over the projection window."
        )
    if health == HealthForecast.DECLINING:
        return (
            "Simulated behavioral drift suggests trust erosion unless savings and repayment "
            "discipline are reinforced within the next two cycles."
        )
    return (
        "Baseline twin model indicates steady financial evolution with moderate trust "
        "acceleration under current behavioral patterns."
    )


def build_forecast(baseline: TwinBaseline, scenario: ScenarioId | None = None) -> TwinForecastResponse:
    settings = get_settings()
    months = settings.default_projection_months
    mod = SCENARIO_MODIFIERS.get(scenario) if scenario else None
    active = scenario.value if scenario else "baseline"

    timeline, savings, risk, projected, health_delta = _simulate_trajectory(baseline, months, mod)
    risk_proj = risk[-1].risk_level if risk else _risk_from_index(50)
    health = _health_from_delta(health_delta)

    return TwinForecastResponse(
        current_trust_score=baseline.trust_score,
        projected_trust_score=projected,
        projection_period_months=months,
        financial_health_forecast=health,
        risk_projection=risk_proj,
        simulation_summary=_simulation_summary(baseline, projected, health),
        recommendations=_recommendations(baseline, projected, risk_proj),
        trust_timeline=timeline,
        savings_forecast=savings,
        risk_timeline=risk,
        active_scenario=active,
    )


def build_trust_projection(baseline: TwinBaseline) -> TrustProjectionResponse:
    settings = get_settings()
    months = settings.default_projection_months
    timeline, _, _, projected, _ = _simulate_trajectory(baseline, months)
    momentum_delta = round(projected - baseline.trust_score, 1)
    return TrustProjectionResponse(
        current_trust_score=baseline.trust_score,
        projected_trust_score=projected,
        projection_period_months=months,
        trust_timeline=timeline,
        momentum_delta=momentum_delta,
    )


def build_risk_simulation(baseline: TwinBaseline) -> RiskSimulationResponse:
    settings = get_settings()
    months = settings.default_projection_months
    _, _, risk, _, _ = _simulate_trajectory(baseline, months)
    current_risk = _risk_from_index(
        50 - baseline.savings_discipline * 0.2 - baseline.repayment_strength * 0.15
    )
    projected_risk = risk[-1].risk_level if risk else current_risk
    loan_impact = (
        "Additional loan utilization would elevate risk by ~14 index points."
        if baseline.trust_score < 75
        else "Current profile supports moderate loan expansion with contained risk."
    )
    return RiskSimulationResponse(
        current_risk=current_risk,
        projected_risk=projected_risk,
        risk_timeline=risk,
        loan_risk_impact=loan_impact,
    )


def build_savings_growth(baseline: TwinBaseline) -> SavingsGrowthResponse:
    settings = get_settings()
    months = settings.default_projection_months
    _, savings, _, _, _ = _simulate_trajectory(baseline, months)
    current = baseline.savings_discipline
    projected = savings[-1].savings_index if savings else current
    rates = [p.growth_rate_pct for p in savings if p.growth_rate_pct]
    avg_rate = round(sum(rates) / len(rates), 2) if rates else 0.0
    return SavingsGrowthResponse(
        current_savings_index=round(current, 1),
        projected_savings_index=projected,
        monthly_growth_rate_pct=avg_rate,
        savings_forecast=savings,
    )


def _scenario_card(baseline: TwinBaseline, sid: ScenarioId) -> FinancialScenario:
    mod = SCENARIO_MODIFIERS[sid]
    _, _, risk, projected, health_delta = _simulate_trajectory(
        baseline, get_settings().default_projection_months, mod
    )
    titles = {
        ScenarioId.INCREASED_SAVINGS: "Increased savings behavior",
        ScenarioId.REDUCED_SPENDING: "Reduced discretionary spending",
        ScenarioId.ADDITIONAL_LOAN: "Additional loan utilization",
        ScenarioId.STABLE_REPAYMENT: "Stable repayment consistency",
        ScenarioId.RISKY_BEHAVIOR: "Risky financial behavior",
        ScenarioId.IMPROVED_INCOME: "Improved income stability",
    }
    descriptions = {
        ScenarioId.INCREASED_SAVINGS: "Model elevates savings discipline by 15% monthly.",
        ScenarioId.REDUCED_SPENDING: "Simulates tighter discretionary spend controls.",
        ScenarioId.ADDITIONAL_LOAN: "Projects impact of new credit line drawdown.",
        ScenarioId.STABLE_REPAYMENT: "Assumes on-time repayment continuity.",
        ScenarioId.RISKY_BEHAVIOR: "Stress-tests volatile spending and missed payments.",
        ScenarioId.IMPROVED_INCOME: "Models salary stability uplift and income growth.",
    }
    return FinancialScenario(
        id=sid,
        title=titles[sid],
        description=descriptions[sid],
        projected_trust_score=projected,
        risk_projection=risk[-1].risk_level if risk else RiskProjection.MEDIUM,
        health_forecast=_health_from_delta(health_delta),
        impact_summary=f"Trust delta {projected - baseline.trust_score:+d} over projection window.",
    )


def build_scenarios(baseline: TwinBaseline) -> ScenariosResponse:
    cards = [_scenario_card(baseline, sid) for sid in ScenarioId]
    best = max(cards, key=lambda c: c.projected_trust_score)
    return ScenariosResponse(scenarios=cards, recommended_scenario=best.id)
