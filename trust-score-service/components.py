"""Normalized component scores shared by scoring and visualization layers."""

from dataclasses import dataclass

from models import EmploymentType, TrustScoreRequest

SALARY_FLOOR = 20_000.0
SALARY_CEILING = 150_000.0


@dataclass(frozen=True)
class ComponentScores:
    salary: float
    credit: float
    repayment: float
    savings: float
    transaction: float
    employment: float


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def normalize_salary(salary: float) -> float:
    span = SALARY_CEILING - SALARY_FLOOR
    if span <= 0:
        return 0.0
    return clamp((salary - SALARY_FLOOR) / span * 100.0)


def normalize_credit(credit_score: int) -> float:
    return clamp((credit_score - 300) / 550.0 * 100.0)


def employment_score(employment: EmploymentType) -> float:
    return {
        EmploymentType.SALARIED: 100.0,
        EmploymentType.SELF_EMPLOYED: 85.0,
        EmploymentType.CONTRACT: 75.0,
        EmploymentType.FREELANCE: 65.0,
        EmploymentType.UNEMPLOYED: 20.0,
    }[employment]


def component_scores(payload: TrustScoreRequest) -> ComponentScores:
    return ComponentScores(
        salary=normalize_salary(payload.salary),
        credit=normalize_credit(payload.credit_score),
        repayment=clamp(payload.repayment_history),
        savings=clamp(payload.savings_consistency),
        transaction=clamp(payload.transaction_stability),
        employment=employment_score(payload.employment_type),
    )
