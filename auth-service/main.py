"""
TRUST Auth Service — identity, credentials, and JWT issuance.
"""

import logging
import sys
from typing import Annotated, Any

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import bcrypt
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db, init_db
from jwt_handler import create_access_token, verify_token
from models import User

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("trust.auth")


app = FastAPI(
    title="TRUST Auth Service",
    version="1.0.0",
    description="User registration, authentication, and JWT management.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    logger.info("Auth service started; database initialized.")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Annotated[Session, Depends(get_db)]) -> dict[str, Any] | JSONResponse:
    """Create a new user account with a bcrypt-hashed password."""
    logger.info("REGISTER RECEIVED email=%s", payload.email.lower())

    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        logger.warning("REGISTER duplicate email=%s", payload.email.lower())
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "User already exists"},
        )

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        logger.warning("REGISTER duplicate race email=%s", payload.email.lower())
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "User already exists"},
        )
    db.refresh(user)

    token = create_access_token(
        subject=str(user.id),
        extra_claims={"email": user.email, "full_name": user.full_name},
    )

    return {
        "success": True,
        "message": "User registered successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
        },
    }


@app.post("/login")
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> dict[str, Any]:
    """Authenticate user and return a JWT access token."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        logger.warning("Login failed for email=%s", payload.email.lower())
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    logger.info("Login successful for user_id=%s email=%s", user.id, user.email)
    token = create_access_token(
        subject=str(user.id),
        extra_claims={"email": user.email, "full_name": user.full_name},
    )

    return {
        "success": True,
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
        },
    }


@app.get("/verify-token")
def verify_token_endpoint(
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, Any]:
    """
    Validate Bearer token and return decoded claims.
    Used by clients and the gateway for session checks.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be Bearer <token>",
        )

    try:
        claims = verify_token(parts[1])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from None

    return {
        "success": True,
        "valid": True,
        "claims": claims,
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "auth-service"}
