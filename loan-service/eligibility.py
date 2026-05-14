"""
Loan eligibility business rules isolated from transport (FastAPI) layer.

Policy summary (illustrative institutional rules):
- Minimum annual salary and minimum credit score gates
- Age within lending band
- Employment type adjusts risk appetite
"""

from dataclasses import dataclass

from models import EmploymentType, LoanCheckRequest, LoanCheckResponse

# --- Policy constants (tune via env in a production system) ---
MIN_ANNUAL_SALARY = 45_000.0
MIN_CREDIT_SCORE = 640
MIN_AGE = 21
MAX_AGE = 64
BASE_ANNUAL_RATE = 0.11  # 11% APR illustrative
TENURE_MONTHS = 60
# Max principal as multiple of annual income, capped
MAX_LOAN_TO_INCOME_RATIO = 4.0
MAX_LOAN_CAP = 500_000.0


@dataclass(frozen=True)
class EligibilityDecision:
    eligible: bool
    max_loan_amount: float
    emi_estimate: float | None
    reason: str


def _compute_emi(principal: float, annual_rate: float, months: int) -> float:
    """
    Standard amortizing loan EMI (equated monthly installment).

    EMI = P * r * (1+r)^n / ((1+r)^n - 1), where r is monthly interest rate.
    """
    if principal <= 0 or months <= 0:
        return 0.0
    monthly_rate = annual_rate / 12.0
    if monthly_rate == 0:
        return principal / months
    factor = (1 + monthly_rate) ** months
    return principal * monthly_rate * factor / (factor - 1)


def _employment_multiplier(employment: EmploymentType) -> float:
    """Risk adjustment for employment stability."""
    return {
        EmploymentType.FULL_TIME: 1.0,
        EmploymentType.CONTRACT: 0.95,
        EmploymentType.PART_TIME: 0.85,
        EmploymentType.SELF_EMPLOYED: 0.9,
        EmploymentType.UNEMPLOYED: 0.5,
    }[employment]


def evaluate_loan(payload: LoanCheckRequest) -> LoanCheckResponse:
    """
    Run eligibility rules and produce a response with amounts and messaging.
    """
    reasons: list[str] = []

    if payload.age < MIN_AGE or payload.age > MAX_AGE:
        reasons.append(f"Age must be between {MIN_AGE} and {MAX_AGE} for this product.")

    if payload.salary <= MIN_ANNUAL_SALARY:
        reasons.append(
            f"Annual salary must exceed {MIN_ANNUAL_SALARY:,.0f} for baseline eligibility.",
        )

    if payload.credit_score < MIN_CREDIT_SCORE:
        reasons.append(
            f"Credit score must be at least {MIN_CREDIT_SCORE}; strengthen credit profile and reapply.",
        )

    if payload.employment_type == EmploymentType.UNEMPLOYED:
        reasons.append("Employment income is required for unsecured retail lending.")

    emp_mult = _employment_multiplier(payload.employment_type)
    adjusted_max = min(
        MAX_LOAN_CAP,
        payload.salary * MAX_LOAN_TO_INCOME_RATIO * emp_mult,
    )

    # Slightly tighten for lower credit tiers
    if payload.credit_score < 700:
        adjusted_max *= 0.85

    eligible = len(reasons) == 0
    principal = round(adjusted_max, 2) if eligible else 0.0
    emi = (
        _compute_emi(principal, BASE_ANNUAL_RATE, TENURE_MONTHS) if eligible else None
    )

    if eligible:
        message = "Applicant meets core policy checks; offer subject to full underwriting."
    else:
        message = "Applicant does not meet minimum policy requirements."

    return LoanCheckResponse(
        eligible=eligible,
        max_loan_amount=principal,
        emi_estimate=round(emi, 2) if emi is not None else None,
        annual_interest_rate=BASE_ANNUAL_RATE,
        tenure_months=TENURE_MONTHS,
        reason=(" ".join(reasons) if reasons else message),
    )
