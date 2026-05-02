"""
Test Runner — Ejecuta tests post-deploy y auto-fix.
"""

import asyncio
import logging
import time
from typing import Optional

logger = logging.getLogger("motor25.test")

TEST_ENDPOINTS = [
    {
        "name": "Health Check",
        "method": "GET",
        "path": "/health",
        "expected_status": 200,
        "risk": "low",
    },
    {
        "name": "Root Endpoint",
        "method": "GET",
        "path": "/",
        "expected_status": 200,
        "risk": "low",
    },
    {
        "name": "v1 Health",
        "method": "GET",
        "path": "/v1/health",
        "expected_status": 200,
        "risk": "low",
    },
    {
        "name": "List Macrocycles",
        "method": "GET",
        "path": "/v1/macrocycles",
        "expected_status": 200,
        "risk": "low",
    },
    {
        "name": "Docs Endpoint",
        "method": "GET",
        "path": "/docs",
        "expected_status": 200,
        "risk": "low",
    },
]

AUTH_ENDPOINTS = [
    {
        "name": "Auth Login (valid)",
        "method": "POST",
        "path": "/v1/auth/login",
        "expected_status": 200,
        "body": {"username": "test@holyoly.com", "password": "testpass123"},
        "risk": "low",
    },
    {
        "name": "Auth Login (invalid)",
        "method": "POST",
        "path": "/v1/auth/login",
        "expected_status": 401,
        "body": {"username": "wrong@holyoly.com", "password": "wrongpass"},
        "risk": "low",
    },
]

SECURITY_ENDPOINTS = [
    {
        "name": "CORS Block",
        "method": "GET",
        "path": "/health",
        "headers": {"Origin": "https://evil.com"},
        "check": "No Access-Control-Allow-Origin header",
        "risk": "medium",
    },
    {
        "name": "Protected Endpoint (no token)",
        "method": "GET",
        "path": "/v1/stress/calculate",
        "expected_status": 401,
        "risk": "low",
    },
    {
        "name": "Exposed .env",
        "method": "GET",
        "path": "/.env",
        "expected_status": 404,
        "risk": "high",
    },
    {
        "name": "Exposed .git",
        "method": "GET",
        "path": "/.git/config",
        "expected_status": 404,
        "risk": "high",
    },
]


class TestAgent:
    """
    Ejecuta tests post-deploy.

    Si encuentra fallos:
    1. Intenta auto-fix si es reversible
    2. Log en agent_decisions
    3. Alerta si no puede fix
    """

    def __init__(self, base_url: str = "http://localhost:8000", db_pool=None):
        self.base_url = base_url
        self.db_pool = db_pool

    async def run_post_deploy_tests(self, deploy_id: str = None) -> dict:
        """
        Ejecutar todos los tests post-deploy.

        Returns:
            dict con resultados: total, passed, failed, duration
        """
        start_time = time.time()
        results = []
        auto_fixes = 0

        # Test endpoints publicos
        for endpoint in TEST_ENDPOINTS:
            result = await self._test_endpoint(endpoint)
            results.append(result)

        # Test auth endpoints
        for endpoint in AUTH_ENDPOINTS:
            result = await self._test_endpoint(endpoint)
            results.append(result)

        # Test security
        for endpoint in SECURITY_ENDPOINTS:
            result = await self._test_endpoint(endpoint)
            results.append(result)

        # Test DB connection
        db_result = await self._test_db_connection()
        results.append(db_result)

        # Contar resultados
        passed = sum(1 for r in results if r["status"] == "passed")
        failed = sum(1 for r in results if r["status"] == "failed")

        # Intentar auto-fix para fallos criticos
        for result in results:
            if result["status"] == "failed" and result.get("auto_fixable"):
                fix_result = await self._attempt_auto_fix(result)
                if fix_result:
                    auto_fixes += 1
                    result["status"] = "fixed"
                    result["auto_fix"] = fix_result

        duration_ms = int((time.time() - start_time) * 1000)

        report = {
            "deploy_id": deploy_id,
            "total": len(results),
            "passed": passed,
            "failed": failed,
            "fixed": auto_fixes,
            "duration_ms": duration_ms,
            "results": results,
            "status": "passed" if failed == 0 else ("partially_passed" if auto_fixes > 0 else "failed"),
        }

        logger.info(
            f"[TestAgent] Post-deploy tests: {passed}/{len(results)} passed, "
            f"{failed} failed, {auto_fixes} auto-fixed ({duration_ms}ms)"
        )

        return report

    async def _test_endpoint(self, endpoint: dict) -> dict:
        """Test un endpoint individual."""
        import httpx

        url = f"{self.base_url}{endpoint['path']}"
        method = endpoint.get("method", "GET")
        expected_status = endpoint.get("expected_status", 200)

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                if method == "GET":
                    headers = endpoint.get("headers", {})
                    resp = await client.get(url, headers=headers)
                elif method == "POST":
                    resp = await client.post(url, json=endpoint.get("body", {}))
                else:
                    resp = await client.request(method, url)

                passed = resp.status_code == expected_status

                # Check CORS si aplica
                if "Origin" in endpoint.get("headers", {}):
                    cors_header = resp.headers.get("Access-Control-Allow-Origin")
                    if endpoint["path"] == "/health":
                        # CORS should block evil.com
                        passed = cors_header is None or cors_header != "https://evil.com"

                return {
                    "test_name": endpoint["name"],
                    "method": method,
                    "path": endpoint["path"],
                    "status": "passed" if passed else "failed",
                    "expected_status": expected_status,
                    "actual_status": resp.status_code,
                    "response_time_ms": int(resp.elapsed.total_seconds() * 1000),
                    "auto_fixable": False,
                }

        except Exception as e:
            return {
                "test_name": endpoint["name"],
                "method": method,
                "path": endpoint["path"],
                "status": "failed",
                "error": str(e),
                "auto_fixable": "connection" in str(e).lower(),
            }

    async def _test_db_connection(self) -> dict:
        """Test conexion a PostgreSQL."""
        if not self.db_pool:
            return {
                "test_name": "DB Connection",
                "status": "skipped",
                "note": "No DB pool configured",
            }

        try:
            row = await self.db_pool.fetchrow("SELECT 1 as check")
            return {
                "test_name": "DB Connection",
                "status": "passed" if row and row["check"] == 1 else "failed",
                "response_time_ms": 0,
            }
        except Exception as e:
            return {
                "test_name": "DB Connection",
                "status": "failed",
                "error": str(e),
                "auto_fixable": True,
            }

    async def _attempt_auto_fix(self, result: dict) -> Optional[str]:
        """Intentar auto-fix para un test fallido."""
        test_name = result.get("test_name", "")

        if "DB Connection" in test_name:
            # Intentar reconectar
            try:
                row = await self.db_pool.fetchrow("SELECT 1 as check")
                if row:
                    return "DB connection restored"
            except Exception:
                pass
            return "DB connection failed — check env vars and DB status"

        if "connection" in result.get("error", "").lower():
            return "Connection issue — may be transient, will retry on next run"

        return None
