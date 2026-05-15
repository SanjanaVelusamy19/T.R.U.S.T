#!/usr/bin/env python3
"""Smoke-test advisor-service endpoints (service must be running on :8004)."""

import json
import sys
import urllib.request

BASE = "http://127.0.0.1:8004"


def get(path: str) -> tuple[int, dict]:
    with urllib.request.urlopen(f"{BASE}{path}", timeout=5) as resp:
        return resp.status, json.loads(resp.read().decode())


def main() -> int:
    failures = []
    for path in (
        "/health",
        "/advisor/summary",
        "/advisor/recommendations",
        "/advisor/risk-analysis",
        "/advisor/financial-health",
    ):
        try:
            code, body = get(path)
            print(f"{path}: {code}")
            if code != 200:
                failures.append(path)
            if path == "/advisor/summary" and "financial_health_score" not in body:
                failures.append("summary missing fields")
        except Exception as exc:
            print(f"{path}: FAIL {exc}")
            failures.append(path)

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
