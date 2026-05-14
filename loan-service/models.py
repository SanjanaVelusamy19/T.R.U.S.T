"""
Pydantic schemas for loan eligibility API contracts.
"""

from enum import Enum

from pydantic import BaseModel, Field


class EmploymentType(str, Enum):
    """Supported employment categories for risk scoring."""

    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    SELF_EMPLOYED = "self_employed"
    UNEMPLOYED = "unemployed"


class LoanCheckRequest(BaseModel):
    """Input payload for eligibility assessment."""

    salary: float = Field(..., gt=0, description="Annual gross salary in base currency units")
    age: int = Field(..., ge=18, le=100)
    employment_type: EmploymentType
    credit_score: int = Field(..., ge=300, le=850)


class LoanCheckResponse(BaseModel):
    """Structured eligibility outcome returned to clients."""

    success: bool = True
    eligible: bool
    max_loan_amount: float
    emi_estimate: float | None = None
    annual_interest_rate: float
    tenure_months: int
    reason: str
