
# TRUST — Microservices Fintech System

Enterprise-style reference implementation of a **microservices fintech platform** with a **React (Vite) dashboard**, **FastAPI** domain services, and a **central API Gateway** that brokers all client traffic.

**Screenshots:** add `login.png`, `dashboard.png`, and `loan-desk.png` under `docs/screenshots/` and link them here after capturing the running UI.

## Overview

**TRUST** simulates how a modern financial institution might decompose capabilities:

- **trust-ui** — operator console (neon glassmorphism, dark mode, responsive).
- **gateway** — public edge: routing, JWT verification for protected resources, SlowAPI rate limits, structured logging, normalized error envelopes.
- **auth-service** — registration, login, bcrypt password hashing, JWT issuance, token introspection.
- **loan-service** — isolated eligibility engine with explainable outcomes and indicative pricing hints.

The **browser never calls auth or loan directly**; it only targets the **gateway** (`http://localhost:8000` by default).

## Architecture

```text
┌─────────────┐      HTTP       ┌────────────────┐
│  trust-ui   │ ───────────────▶│  API Gateway   │
│ (React/Vite)│   (JWT in hdr)  │    (FastAPI)   │
└─────────────┘                 └───────┬────────┘
                                          │
                         ┌────────────────┴────────────────┐
                         │                                 │
                         ▼                                 ▼
                 ┌───────────────┐                 ┌────────────────┐
                 │ auth-service  │                 │  loan-service  │
                 │   (FastAPI)   │                 │   (FastAPI)    │
                 │ SQLite → PG* │                 │  policy engine │
                 └───────────────┘                 └────────────────┘
```

\*SQLite is used for day-one simplicity; SQLAlchemy models and a configurable `DATABASE_URL` make PostgreSQL migration straightforward.

## API Surface (via Gateway)

All paths below are exposed on the gateway host (default `http://localhost:8000`).

| Area | Method | Path | Auth |
|------|--------|------|------|
| Health | GET | `/health` | No |
| Auth | POST | `/api/auth/register` | No |
| Auth | POST | `/api/auth/login` | No |
| Auth | GET | `/api/auth/verify-token` | Bearer JWT |
| Loan | POST | `/api/loan/check-loan` | Bearer JWT (verified at gateway) |

Downstream services also expose `/health` on their own ports for diagnostics.

## Security Controls

- **JWT** access tokens signed by `auth-service`, validated by **gateway** before loan traffic is proxied.
- **bcrypt** password hashing via Passlib.
- **SlowAPI** default rate limits on gateway routes (configurable string, e.g. `100/minute`).
- **Secrets** supplied through environment variables — never commit real `.env` files.

## Prerequisites

- **Docker Desktop** (or Docker Engine + Compose v2) *or*
- **Python 3.12+**, **Node.js 22+**, **npm** for fully local runs.

## Quick Start (Docker Compose)

From the `TRUST_Project` directory:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Then open:

- UI (static build behind nginx): `http://localhost:8080`
- Gateway docs: `http://localhost:8000/docs`
- Auth docs (direct): `http://localhost:8001/docs`
- Loan docs (direct): `http://localhost:8002/docs`

> The UI build bakes `VITE_API_URL` for browser calls. With Compose defaults, the browser still talks to the gateway at **`http://localhost:8000`**, which is correct when ports are published to your machine.

## Local Development (without Docker)

### 1. Auth service (terminal 1)

```powershell
cd auth-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:JWT_SECRET = "dev-secret-change-me"
$env:AUTH_DATA_DIR = "./data"
uvicorn main:app --reload --port 8001
```

### 2. Loan service (terminal 2)

```powershell
cd loan-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

### 3. Gateway (terminal 3)

```powershell
cd gateway
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:JWT_SECRET = "dev-secret-change-me"
$env:AUTH_SERVICE_URL = "http://127.0.0.1:8001"
$env:LOAN_SERVICE_URL = "http://127.0.0.1:8002"
uvicorn main:app --reload --port 8000
```

### 4. Frontend (terminal 4)

```powershell
cd trust-ui
npm install
$env:VITE_API_URL = "http://localhost:8000"
npm run dev
```

Visit `http://localhost:5173`.

## Loan Eligibility Logic (Illustrative)

The engine applies deterministic gates (see `loan-service/eligibility.py`):

- Minimum annual salary and credit score thresholds.
- Lending-age band.
- Employment-type risk multiplier and caps on principal.
- **EMI** computed with a standard amortizing formula at an illustrative APR and tenor.

Declined applications return **zero** principal with narrative reasons; approvals include **max principal** and **EMI estimate**.

## Project Layout

```text
TRUST_Project/
├── gateway/              # API Gateway (FastAPI)
├── auth-service/         # Identity + JWT
├── loan-service/         # Eligibility engine
├── trust-ui/             # React + Vite + Tailwind v4
├── docker-compose.yml
├── .env.example
└── README.md
```

## Future Improvements

- **PostgreSQL** with Alembic migrations and read replicas for auth.
- **Redis**-backed rate limiting and session deny-lists at the gateway.
- **OpenTelemetry** tracing across services with correlation IDs (gateway already stamps `X-Request-Id`).
- **mTLS** or signed service-to-service tokens between gateway and internal workloads.
- **Cognito/Keycloak** integration for enterprise IdP federation.
- **Contract tests** (Schemathesis / Dredd) and **k6** load tests in CI.

## License

Reference/educational codebase — apply your own license for production reuse.


