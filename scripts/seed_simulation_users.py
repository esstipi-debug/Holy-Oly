"""
Seed de usuarios para simulaciones QA.

Crea 8 usuarios contra el backend de Render (o el host pasado por env):
  - 3 atletas HO + 1 coach HO  (club ficticio "Sim Box HO")
  - 3 atletas VOL + 1 coach VOL (box ficticio "Sim Box VOL")

Idempotente: si el email ya existe (409), hace login para recuperar el token.
Persiste credenciales y tokens en `.claire/sim_users.json`.

Uso:
    python scripts/seed_simulation_users.py
    BACKEND_URL=http://localhost:8000 python scripts/seed_simulation_users.py
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BACKEND_URL = os.environ.get("BACKEND_URL", "https://holy-oly-3.onrender.com").rstrip("/")
PASSWORD = os.environ.get("SIM_PASSWORD", "SimTest123!")
OUTPUT = Path(__file__).resolve().parent.parent / ".claire" / "sim_users.json"

USERS = [
    # name, email, role, product
    ("Sim HO Atleta 1", "sim_ho_atleta_1@holyolysim.com", "athlete", "holy-oly"),
    ("Sim HO Atleta 2", "sim_ho_atleta_2@holyolysim.com", "athlete", "holy-oly"),
    ("Sim HO Atleta 3", "sim_ho_atleta_3@holyolysim.com", "athlete", "holy-oly"),
    ("Sim HO Coach",    "sim_ho_coach@holyolysim.com",    "coach",   "holy-oly"),
    ("Sim VOL Atleta 1","sim_vol_atleta_1@holyolysim.com","athlete", "volta"),
    ("Sim VOL Atleta 2","sim_vol_atleta_2@holyolysim.com","athlete", "volta"),
    ("Sim VOL Atleta 3","sim_vol_atleta_3@holyolysim.com","athlete", "volta"),
    ("Sim VOL Coach",   "sim_vol_coach@holyolysim.com",   "coach",   "volta"),
]


def _post_json(path: str, body: dict) -> tuple[int, dict | str]:
    url = f"{BACKEND_URL}{path}"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = resp.read().decode("utf-8")
            return resp.status, json.loads(payload) if payload else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(body)
        except json.JSONDecodeError:
            return e.code, body


def _post_form(path: str, fields: dict) -> tuple[int, dict | str]:
    url = f"{BACKEND_URL}{path}"
    data = urllib.parse.urlencode(fields).encode("utf-8")
    req = urllib.request.Request(
        url, data=data,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = resp.read().decode("utf-8")
            return resp.status, json.loads(payload) if payload else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(body)
        except json.JSONDecodeError:
            return e.code, body


def register_or_login(name: str, email: str, role: str, product: str) -> dict:
    code, body = _post_json("/v1/auth/register", {
        "email": email, "password": PASSWORD,
        "name": name, "role": role, "product": product,
    })
    if code == 200 and isinstance(body, dict):
        return {"status": "registered", "data": body}

    if code == 409:
        # Existing user → login para obtener token
        code2, body2 = _post_form("/v1/auth/login", {
            "username": email, "password": PASSWORD,
        })
        if code2 == 200 and isinstance(body2, dict):
            return {"status": "existed", "data": body2}
        return {"status": "exists_but_login_failed", "register_body": body, "login_code": code2, "login_body": body2}

    return {"status": "failed", "code": code, "body": body}


def main() -> int:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    print(f"[seed] Backend: {BACKEND_URL}")
    print(f"[seed] Password: {PASSWORD}")
    print(f"[seed] Output:   {OUTPUT}")

    results = []
    ok = 0
    for name, email, role, product in USERS:
        print(f"  · {email:38s} ({role:7s} · {product:8s}) ... ", end="", flush=True)
        outcome = register_or_login(name, email, role, product)
        status = outcome.get("status")
        if status in ("registered", "existed"):
            ok += 1
            data = outcome.get("data", {})
            token = data.get("access_token", "")
            user = data.get("user", {})
            results.append({
                "name": name, "email": email, "role": role, "product": product,
                "password": PASSWORD,
                "user_id": user.get("id"),
                "access_token": token,
                "seeded_status": status,
            })
            print(status)
        else:
            print(f"FAIL · {outcome}")
            results.append({
                "name": name, "email": email, "role": role, "product": product,
                "password": PASSWORD,
                "error": outcome,
            })

    payload = {
        "seeded_at": datetime.now(timezone.utc).isoformat(),
        "backend_url": BACKEND_URL,
        "password": PASSWORD,
        "frontend_url": os.environ.get("FRONTEND_URL", "https://holy-oly.onrender.com"),
        "users": results,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n[seed] {ok}/{len(USERS)} OK · escrito en {OUTPUT}")
    return 0 if ok == len(USERS) else 1


if __name__ == "__main__":
    sys.exit(main())
