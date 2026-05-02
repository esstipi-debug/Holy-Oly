"""
Test Report — Genera reportes de resultados de tests.
"""

import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger("motor25.test")


class TestReport:
    """Genera y persiste reportes de tests."""

    def __init__(self, db_pool=None):
        self.db_pool = db_pool

    async def save_run(self, deploy_id: str, report: dict) -> Optional[str]:
        """Guardar test run en DB."""
        if not self.db_pool:
            return None

        query = """
            INSERT INTO test_runs
            (deploy_id, status, total_tests, passed_tests, failed_tests,
             auto_fixes_applied, duration_seconds, report, completed_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        """
        try:
            row = await self.db_pool.fetchrow(
                query,
                deploy_id,
                report.get("status", "unknown"),
                report.get("total", 0),
                report.get("passed", 0),
                report.get("failed", 0),
                report.get("fixed", 0),
                report.get("duration_ms", 0) // 1000,
                report.get("results", []),
                datetime.utcnow(),
            )
            return str(row["id"])
        except Exception as e:
            logger.error(f"[TestReport] Failed to save: {e}")
            return None

    async def save_results(self, test_run_id: str, results: list):
        """Guardar resultados individuales."""
        if not self.db_pool or not test_run_id:
            return

        for result in results:
            query = """
                INSERT INTO test_results
                (test_run_id, test_name, status, error_message, response_time_ms, details)
                VALUES ($1, $2, $3, $4, $5, $6)
            """
            try:
                await self.db_pool.execute(
                    query,
                    test_run_id,
                    result.get("test_name", "unknown"),
                    result.get("status", "unknown"),
                    result.get("error"),
                    result.get("response_time_ms", 0),
                    {k: v for k, v in result.items() if k not in ("test_name", "status", "error", "response_time_ms")},
                )
            except Exception as e:
                logger.error(f"[TestReport] Failed to save result: {e}")

    async def get_latest_run(self) -> Optional[dict]:
        """Obtener ultimo test run."""
        if not self.db_pool:
            return None

        try:
            row = await self.db_pool.fetchrow(
                "SELECT * FROM test_runs ORDER BY created_at DESC LIMIT 1"
            )
            return dict(row) if row else None
        except Exception as e:
            logger.error(f"[TestReport] Failed to fetch: {e}")
            return None

    def format_summary(self, report: dict) -> str:
        """Format report as human-readable summary."""
        status_emoji = {"passed": "✅", "failed": "❌", "partially_passed": "⚠️", "running": "🔄"}
        emoji = status_emoji.get(report.get("status", "unknown"), "❓")

        lines = [
            f"{emoji} Test Report — Deploy: {report.get('deploy_id', 'unknown')[:8]}",
            f"Total: {report.get('total', 0)} | Passed: {report.get('passed', 0)} | "
            f"Failed: {report.get('failed', 0)} | Fixed: {report.get('fixed', 0)}",
            f"Duration: {report.get('duration_ms', 0)}ms",
            f"Status: {report.get('status', 'unknown').upper()}",
        ]

        failed_tests = [r for r in report.get("results", []) if r.get("status") == "failed"]
        if failed_tests:
            lines.append("\nFailed tests:")
            for test in failed_tests:
                lines.append(f"  ❌ {test.get('test_name')}: {test.get('error', 'unexpected status')}")

        return "\n".join(lines)
