#!/usr/bin/env python3
"""Smoke-test TRUST gateway + trust-score integration (run services first)."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

GATEWAY = "http://127.0.0.1:8000"
TRUST = "http://127.0.0.1:8003"
AUTH = "http://127.0.0.1:8001"
FRAUD = "http://127.0.0.1:8005"
MONITOR = "http://127.0.0.1:8006"


def get(url: str, headers: dict | None = None, timeout: float = 5) -> tuple[int, dict | list | str]:
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode()
            try:
                return resp.status, json.loads(body)
            except json.JSONDecodeError:
                return resp.status, body
    except urllib.error.HTTPError as exc:
        body = exc.read().decode()
        try:
            return exc.code, json.loads(body)
        except json.JSONDecodeError:
            return exc.code, body


def post_json(url: str, payload: dict) -> tuple[int, dict | list | str]:
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = resp.read().decode()
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode()
        try:
            return exc.code, json.loads(body)
        except json.JSONDecodeError:
            return exc.code, body


def main() -> int:
    failures: list[str] = []

    code, body = get(f"{TRUST}/health")
    if code != 200:
        failures.append(f"trust-score /health -> {code}")
    print(f"trust-score /health: {code}")

    code, openapi = get(f"{TRUST}/openapi.json")
    paths = openapi.get("paths", {}) if isinstance(openapi, dict) else {}
    if "/analytics/dashboard" not in paths:
        failures.append(
            "trust-score-service on :8003 is outdated (missing /analytics/dashboard). "
            "Stop the old process and restart: cd trust-score-service && "
            "python -m uvicorn main:app --reload --port 8003"
        )
        print("trust-score openapi: STALE (only", list(paths.keys()), ")")
    else:
        print("trust-score openapi: OK")

    code, body = get(f"{TRUST}/analytics/dashboard")
    if code != 200 or not isinstance(body, dict) or "timeline" not in body:
        failures.append(f"trust-score /analytics/dashboard -> {code}")
    print(f"trust-score /analytics/dashboard: {code}")

    code, body = get(f"{FRAUD}/health")
    if code != 200:
        failures.append(f"fraud-detection /health -> {code}")
    print(f"fraud-detection /health: {code}")

    code, body = get(f"{FRAUD}/fraud/analysis")
    if code != 200 or not isinstance(body, dict) or "fraud_risk_score" not in body:
        failures.append(f"fraud-detection /fraud/analysis -> {code}")
    print(f"fraud-detection /fraud/analysis: {code}")

    code, body = get(f"{MONITOR}/health")
    if code != 200:
        failures.append(f"monitoring /health -> {code}")
    print(f"monitoring /health: {code}")

    code, body = get(f"{MONITOR}/monitor/system-health", timeout=60.0)
    if code != 200 or not isinstance(body, dict) or "system_status" not in body:
        failures.append(f"monitoring /monitor/system-health -> {code}")
    print(f"monitoring /monitor/system-health: {code}")

    code, body = get(f"{GATEWAY}/health")
    if code != 200:
        failures.append(f"gateway /health -> {code}")
    print(f"gateway /health: {code}")

    # Login for JWT
    code, login = post_json(
        f"{GATEWAY}/api/auth/login",
        {"email": "demo@trust.local", "password": "DemoPass123!"},
    )
    token = login.get("access_token") if isinstance(login, dict) else None
    if code != 200 or not token:
        print(f"login skipped ({code}) — register a user or start auth-service")
    else:
        headers = {"Authorization": f"Bearer {token}"}
        code, dash = get(f"{GATEWAY}/api/trust/analytics/dashboard", headers)
        if code != 200 or not isinstance(dash, dict) or "timeline" not in dash:
            failures.append(f"gateway dashboard -> {code} {dash}")
        print(f"gateway /api/trust/analytics/dashboard: {code}")

        for path in ("/history", "/radar", "/recommendations", "/analytics"):
            c, _ = get(f"{GATEWAY}/api/trust{path}", headers)
            print(f"gateway /api/trust{path}: {c}")
            if c != 200:
                failures.append(f"gateway {path} -> {c}")

        for path in ("/analysis", "/alerts", "/risk-score", "/behavior-check"):
            c, fraud_body = get(f"{GATEWAY}/api/fraud{path}", headers)
            print(f"gateway /api/fraud{path}: {c}")
            if c != 200:
                failures.append(f"gateway /api/fraud{path} -> {c}")
            elif path == "/analysis" and (
                not isinstance(fraud_body, dict) or "fraud_risk_score" not in fraud_body
            ):
                failures.append("gateway /api/fraud/analysis missing fraud_risk_score")

        for path in ("/system-health", "/services", "/alerts", "/latency", "/health-history"):
            c, mon_body = get(f"{GATEWAY}/api/monitor{path}", headers, timeout=60.0)
            print(f"gateway /api/monitor{path}: {c}")
            if c != 200:
                failures.append(f"gateway /api/monitor{path} -> {c}")
            elif path == "/system-health" and (
                not isinstance(mon_body, dict) or "services" not in mon_body
            ):
                failures.append("gateway /api/monitor/system-health missing services")

    if failures:
        print("\nFAILED:")
        for item in failures:
            print(f"  - {item}")
        return 1

    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
