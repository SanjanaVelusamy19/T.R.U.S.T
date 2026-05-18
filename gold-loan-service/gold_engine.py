"""Gold valuation and trust-aware lending intelligence."""

from __future__ import annotations

from dataclasses import dataclass

from config import get_settings
from models import (
    CollateralBreakdown,
    GoldEvaluateRequest,
    GoldEvaluateResponse,
    GoldPurity,
    InterestRateTier,
    InterestRatesResponse,
    LendingRecommendation,
    RecommendationsResponse,
    RiskAnalysisResponse,
    RiskFactor,
    RiskLevel,
)
from trust_client import TrustBaseline

PURITY_FACTORS: dict[GoldPurity, float] = {
    GoldPurity.K24: 1.0,
    GoldPurity.K22: 0.916,
    GoldPurity.K18: 0.75,
    GoldPurity.K14: 0.583,
}


@dataclass(frozen=True)
class ValuationResult:
    estimated_gold_value: float
    eligible_loan_amount: float
    trust_adjusted_limit: float
    collateral_risk_score: float


def _purity_factor(purity: GoldPurity) -> float:
    return PURITY_FACTORS[purity]


def estimate_gold_value(weight_grams: float, purity: GoldPurity) -> float:
    settings = get_settings()
    factor = _purity_factor(purity)
    reference = settings.market_rate_per_gram_22k
    per_gram = reference * (factor / PURITY_FACTORS[GoldPurity.K22])
    return round(weight_grams * per_gram, 2)


def _trust_multiplier(trust_score: int) -> float:
    if trust_score >= 85:
        return 1.0
    if trust_score >= 75:
        return 0.97
    if trust_score >= 65:
        return 0.93
    if trust_score >= 55:
        return 0.88
    return 0.82


def _collateral_risk_score(weight: float, purity: GoldPurity, gold_value: float) -> float:
    purity_penalty = (1.0 - _purity_factor(purity)) * 35.0
    weight_penalty = 0.0 if weight >= 10 else (10 - weight) * 2.5
    value_penalty = 0.0 if gold_value >= 100_000 else max(0.0, (100_000 - gold_value) / 5000)
    return round(min(100.0, 15.0 + purity_penalty + weight_penalty + value_penalty), 1)


def _classify_risk(
    trust_score: int,
    collateral_risk: float,
    repayment_safety: float,
    ltv_ratio: float,
) -> RiskLevel:
    if collateral_risk >= 70 or repayment_safety < 40 or ltv_ratio > 0.8:
        return RiskLevel.CRITICAL
    if collateral_risk >= 50 or repayment_safety < 55 or ltv_ratio > 0.72:
        return RiskLevel.HIGH
    if trust_score >= 75 and collateral_risk < 35 and repayment_safety >= 70:
        return RiskLevel.LOW
    if trust_score >= 60 and repayment_safety >= 55:
        return RiskLevel.MEDIUM
    return RiskLevel.HIGH


def _annual_rate(trust_score: int, risk: RiskLevel) -> float:
    settings = get_settings()
    base = settings.base_annual_interest_rate
    trust_discount = max(0.0, (trust_score - 70) * 0.0008)
    risk_premium = {
        RiskLevel.LOW: 0.0,
        RiskLevel.MEDIUM: 0.0075,
        RiskLevel.HIGH: 0.015,
        RiskLevel.CRITICAL: 0.025,
    }[risk]
    return max(0.065, min(0.16, base - trust_discount + risk_premium))


def _format_rate(rate: float) -> str:
    return f"{rate * 100:.1f}%"


def _repayment_safety(
    monthly_income: float | None,
    loan_amount: float,
    tenure_months: int,
    annual_rate: float,
) -> float:
    if loan_amount <= 0:
        return 100.0
    monthly_rate = annual_rate / 12.0
    if monthly_rate <= 0:
        emi = loan_amount / tenure_months
    else:
        factor = (1 + monthly_rate) ** tenure_months
        emi = loan_amount * monthly_rate * factor / (factor - 1)
    income = monthly_income if monthly_income and monthly_income > 0 else loan_amount / 6
    ratio = emi / income
    if ratio <= 0.25:
        return 95.0
    if ratio <= 0.35:
        return 82.0
    if ratio <= 0.45:
        return 68.0
    if ratio <= 0.55:
        return 52.0
    return 35.0


def value_collateral(
    weight_grams: float,
    purity: GoldPurity,
    baseline: TrustBaseline,
) -> ValuationResult:
    settings = get_settings()
    gold_value = estimate_gold_value(weight_grams, purity)
    eligible = round(gold_value * settings.max_loan_to_value_ratio, 2)
    adjusted = round(eligible * _trust_multiplier(baseline.trust_score), 2)
    collateral_risk = _collateral_risk_score(weight_grams, purity, gold_value)
    return ValuationResult(
        estimated_gold_value=gold_value,
        eligible_loan_amount=eligible,
        trust_adjusted_limit=adjusted,
        collateral_risk_score=collateral_risk,
    )


def evaluate_gold_loan(
    payload: GoldEvaluateRequest,
    baseline: TrustBaseline,
) -> GoldEvaluateResponse:
    valuation = value_collateral(payload.gold_weight_grams, payload.purity, baseline)
    tenure = payload.tenure_months
    loan_amount = payload.requested_loan_amount or valuation.trust_adjusted_limit
    loan_amount = min(loan_amount, valuation.trust_adjusted_limit)
    ltv = loan_amount / valuation.estimated_gold_value if valuation.estimated_gold_value else 1.0
    annual_rate = _annual_rate(baseline.trust_score, RiskLevel.LOW)
    repayment_safety = _repayment_safety(
        payload.monthly_income,
        loan_amount,
        tenure,
        annual_rate,
    )
    risk = _classify_risk(
        baseline.trust_score,
        valuation.collateral_risk_score,
        repayment_safety,
        ltv,
    )
    annual_rate = _annual_rate(baseline.trust_score, risk)
    eligible = (
        loan_amount > 0
        and risk not in {RiskLevel.CRITICAL}
        and loan_amount <= valuation.trust_adjusted_limit
    )
    recommendations = _build_recommendation_strings(
        baseline,
        risk,
        eligible,
        valuation,
        repayment_safety,
    )
    return GoldEvaluateResponse(
        gold_weight_grams=payload.gold_weight_grams,
        purity=payload.purity.value,
        estimated_gold_value=valuation.estimated_gold_value,
        eligible_loan_amount=valuation.eligible_loan_amount,
        trust_adjusted_limit=valuation.trust_adjusted_limit,
        risk_level=risk,
        interest_rate=_format_rate(annual_rate),
        trust_score=baseline.trust_score,
        repayment_safety_score=repayment_safety,
        collateral_risk_score=valuation.collateral_risk_score,
        eligible=eligible,
        recommendations=recommendations,
    )


def _build_recommendation_strings(
    baseline: TrustBaseline,
    risk: RiskLevel,
    eligible: bool,
    valuation: ValuationResult,
    repayment_safety: float,
) -> list[str]:
    recs: list[str] = []
    if eligible and risk == RiskLevel.LOW:
        recs.append("Eligible for low-risk gold-backed loan.")
    elif eligible:
        recs.append("Eligible with standard collateral monitoring and tenure caps.")
    else:
        recs.append("Reduce requested amount or improve trust profile before disbursement.")

    if baseline.trust_score >= 75:
        recs.append("Strong repayment behavior improves lending confidence.")
    elif baseline.trust_score >= 60:
        recs.append("Maintain consistent savings and payment patterns to unlock higher limits.")
    else:
        recs.append("Trust score below institutional comfort — consider smaller ticket size.")

    if repayment_safety >= 75:
        recs.append("Repayment capacity supports safe EMI scheduling.")
    elif repayment_safety < 55:
        recs.append("Declared income suggests tightening tenure or lowering principal.")

    if valuation.collateral_risk_score > 45:
        recs.append("Collateral profile warrants enhanced purity verification.")
    return recs


def build_risk_analysis(
    baseline: TrustBaseline,
    weight_grams: float = 50.0,
    purity: GoldPurity = GoldPurity.K22,
) -> RiskAnalysisResponse:
    valuation = value_collateral(weight_grams, purity, baseline)
    repayment = _repayment_safety(
        None,
        valuation.trust_adjusted_limit,
        get_settings().default_tenure_months,
        _annual_rate(baseline.trust_score, RiskLevel.MEDIUM),
    )
    ltv = (
        valuation.trust_adjusted_limit / valuation.estimated_gold_value
        if valuation.estimated_gold_value
        else 0
    )
    risk = _classify_risk(
        baseline.trust_score,
        valuation.collateral_risk_score,
        repayment,
        ltv,
    )
    factors = [
        RiskFactor(
            name="Collateral quality",
            score=100.0 - valuation.collateral_risk_score,
            status=_score_to_status(100.0 - valuation.collateral_risk_score),
            detail=f"{purity.value} gold at {weight_grams}g — estimated value {valuation.estimated_gold_value:,.0f}",
        ),
        RiskFactor(
            name="Trust profile",
            score=float(baseline.trust_score),
            status=_score_to_status(float(baseline.trust_score)),
            detail=f"Institutional trust index {baseline.trust_score}",
        ),
        RiskFactor(
            name="Repayment safety",
            score=repayment,
            status=_score_to_status(repayment),
            detail="Modeled EMI burden vs inferred income capacity",
        ),
    ]
    return RiskAnalysisResponse(
        risk_level=risk,
        collateral_risk_score=valuation.collateral_risk_score,
        trust_score=baseline.trust_score,
        trust_impact=(
            "Trust profile supports preferential LTV"
            if baseline.trust_score >= 75
            else "Trust profile applies conservative lending haircut"
        ),
        factors=factors,
        summary=f"Composite collateral-backed risk assessed as {risk.value} with trust-aware limits.",
    )


def _score_to_status(score: float) -> RiskLevel:
    if score >= 75:
        return RiskLevel.LOW
    if score >= 55:
        return RiskLevel.MEDIUM
    if score >= 40:
        return RiskLevel.HIGH
    return RiskLevel.CRITICAL


def build_interest_rates(baseline: TrustBaseline) -> InterestRatesResponse:
    tiers = [
        InterestRateTier(
            tier="Premier",
            annual_rate=_format_rate(_annual_rate(88, RiskLevel.LOW)),
            trust_range="85–100",
            description="Best rates for high-trust borrowers with clean collateral.",
        ),
        InterestRateTier(
            tier="Preferred",
            annual_rate=_format_rate(_annual_rate(76, RiskLevel.LOW)),
            trust_range="70–84",
            description="Competitive gold-backed lending for stable profiles.",
        ),
        InterestRateTier(
            tier="Standard",
            annual_rate=_format_rate(_annual_rate(62, RiskLevel.MEDIUM)),
            trust_range="55–69",
            description="Standard institutional spread with monitoring.",
        ),
        InterestRateTier(
            tier="Cautious",
            annual_rate=_format_rate(_annual_rate(48, RiskLevel.HIGH)),
            trust_range="Below 55",
            description="Enhanced margin for elevated behavioral risk.",
        ),
    ]
    current_risk = _classify_risk(
        baseline.trust_score,
        30.0,
        70.0,
        0.65,
    )
    return InterestRatesResponse(
        base_rate=_format_rate(get_settings().base_annual_interest_rate),
        tiers=tiers,
        current_applicable_rate=_format_rate(_annual_rate(baseline.trust_score, current_risk)),
        trust_score=baseline.trust_score,
    )


def build_recommendations(
    baseline: TrustBaseline,
    weight_grams: float = 50.0,
    purity: GoldPurity = GoldPurity.K22,
) -> RecommendationsResponse:
    evaluation = evaluate_gold_loan(
        GoldEvaluateRequest(
            gold_weight_grams=weight_grams,
            purity=purity,
            tenure_months=get_settings().default_tenure_months,
        ),
        baseline,
    )
    items = [
        LendingRecommendation(
            title="Collateral-backed limit",
            detail=f"Trust-adjusted ceiling {evaluation.trust_adjusted_limit:,.0f} against gold value {evaluation.estimated_gold_value:,.0f}.",
            priority="high",
        ),
        LendingRecommendation(
            title="Rate guidance",
            detail=f"Indicative annual rate {evaluation.interest_rate} for current risk tier {evaluation.risk_level.value}.",
            priority="medium",
        ),
        LendingRecommendation(
            title="Repayment posture",
            detail=f"Repayment safety score {evaluation.repayment_safety_score:.0f}/100 — align tenure with cash-flow.",
            priority="medium",
        ),
    ]
    return RecommendationsResponse(
        trust_score=baseline.trust_score,
        risk_level=evaluation.risk_level,
        recommendations=items,
        adaptive_insights=evaluation.recommendations,
    )


def collateral_chart_data(
    weight_grams: float,
    purity: GoldPurity,
    baseline: TrustBaseline,
) -> list[CollateralBreakdown]:
    valuation = value_collateral(weight_grams, purity, baseline)
    return [
        CollateralBreakdown(label="Gold value", value=valuation.estimated_gold_value),
        CollateralBreakdown(label="Max eligible (LTV)", value=valuation.eligible_loan_amount),
        CollateralBreakdown(label="Trust-adjusted", value=valuation.trust_adjusted_limit),
    ]
