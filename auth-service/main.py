"""
TRUST Auth Service — identity, credentials, and JWT issuance.
"""

import logging
import sys
from typing import Annotated, Any

import bcrypt
from fastapi import Depends, FastAPI, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
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


def _user_payload(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
    }


@app.post("/register")
def register(payload: RegisterRequest, db: Annotated[Session, Depends(get_db)]) -> JSONResponse:
    """Create a new user account with a bcrypt-hashed password."""
    email = payload.email.lower().strip()
    logger.info("REGISTER RECEIVED email=%s", email)

    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            logger.warning("REGISTER duplicate email=%s", email)
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "error": "user_already_exists",
                    "message": "User already exists",
                },
            )

        user = User(
            email=email,
            full_name=payload.full_name.strip(),
            hashed_password=hash_password(payload.password),
        )
        db.add(user)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            logger.warning("REGISTER duplicate race email=%s", email)
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "error": "user_already_exists",
                    "message": "User already exists",
                },
            )
        db.refresh(user)

        token = create_access_token(
            subject=str(user.id),
            extra_claims={"email": user.email, "full_name": user.full_name},
        )

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "success": True,
                "message": "User registered successfully",
                "access_token": token,
                "token_type": "bearer",
                "user": _user_payload(user),
            },
        )
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("REGISTER database error email=%s", email)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "registration_failed",
                "detail": str(exc),
            },
        )
    except Exception as exc:
        db.rollback()
        logger.exception("REGISTER unexpected error email=%s", email)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "registration_failed",
                "detail": str(exc),
            },
        )


@app.post("/login")
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> JSONResponse:
    """Authenticate user and return a JWT access token."""
    email = payload.email.lower().strip()

    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(payload.password, user.hashed_password):
            logger.warning("Login failed for email=%s", email)
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "success": False,
                    "error": "invalid_credentials",
                    "message": "Invalid email or password",
                },
            )

        logger.info("Login successful for user_id=%s email=%s", user.id, user.email)
        token = create_access_token(
            subject=str(user.id),
            extra_claims={"email": user.email, "full_name": user.full_name},
        )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "message": "Login successful",
                "access_token": token,
                "token_type": "bearer",
                "user": _user_payload(user),
            },
        )
    except Exception as exc:
        logger.exception("LOGIN unexpected error email=%s", email)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "login_failed",
                "detail": str(exc),
            },
        )


@app.get("/verify-token")
def verify_token_endpoint(
    authorization: Annotated[str | None, Header()] = None,
) -> JSONResponse:
    """Validate Bearer token and return decoded claims."""
    if not authorization:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "success": False,
                "error": "missing_authorization",
                "message": "Missing Authorization header",
            },
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "success": False,
                "error": "invalid_authorization",
                "message": "Authorization header must be Bearer <token>",
            },
        )

    try:
        claims = verify_token(parts[1])
    except Exception as exc:
        logger.warning("verify-token failed: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "success": False,
                "error": "invalid_token",
                "message": "Invalid or expired token",
            },
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "valid": True,
            "claims": claims,
        },
    )


@app.get("/health")
def health() -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"status": "healthy", "service": "auth-service"},
    )
