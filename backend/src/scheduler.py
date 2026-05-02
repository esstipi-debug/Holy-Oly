"""
APScheduler Integration — Cron jobs para los 5 agentes.
Integrado con FastAPI lifespan.
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Callable

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger("motor25.scheduler")

# Global scheduler instance
scheduler: AsyncIOScheduler = None


def init_scheduler(db_pool=None, agents: dict = None):
    """Initialize scheduler with agent references."""
    global scheduler
    scheduler = AsyncIOScheduler()

    if agents is None:
        agents = {}

    test_agent = agents.get("test")
    security_agent = agents.get("security")
    growth_agent = agents.get("growth")
    content_agent = agents.get("content")

    # ==========================================
    # KEEP ALIVE — Ping Render cada 5 min
    # ==========================================
    scheduler.add_job(
        _keep_alive,
        IntervalTrigger(minutes=5),
        id="keep_alive",
        name="Ping Render (keep dyno alive)",
        replace_existing=True,
        max_instances=1,
    )

    # ==========================================
    # DAILY JOBS
    # ==========================================
    if growth_agent:
        scheduler.add_job(
            growth_agent.run,
            CronTrigger(hour=2, minute=0, timezone="America/Santiago"),
            id="engagement_scores",
            name="Calculate engagement scores",
            replace_existing=True,
            max_instances=1,
        )

        scheduler.add_job(
            growth_agent.run_churn_prediction,
            CronTrigger(hour=3, minute=0, timezone="America/Santiago"),
            id="churn_prediction",
            name="Churn prediction",
            replace_existing=True,
            max_instances=1,
        )

        scheduler.add_job(
            growth_agent.run_trial_reminders,
            CronTrigger(hour=9, minute=0, timezone="America/Santiago"),
            id="trial_reminders",
            name="Send trial reminder emails",
            replace_existing=True,
            max_instances=1,
        )

        scheduler.add_job(
            growth_agent.run_winback_emails,
            CronTrigger(hour=10, minute=0, timezone="America/Santiago"),
            id="winback_emails",
            name="Send win-back emails",
            replace_existing=True,
            max_instances=1,
        )

        scheduler.add_job(
            growth_agent.run_pricing_analysis,
            CronTrigger(hour=19, minute=0, timezone="America/Santiago"),
            id="pricing_analysis",
            name="Pricing analysis",
            replace_existing=True,
            max_instances=1,
        )

    if content_agent:
        scheduler.add_job(
            content_agent.generate_daily_pildora,
            CronTrigger(hour=9, minute=0, timezone="America/Santiago"),
            id="daily_pildora",
            name="Generate daily pildora",
            replace_existing=True,
            max_instances=1,
        )

    if security_agent:
        scheduler.add_job(
            security_agent.run_daily_check,
            CronTrigger(hour=3, minute=0, timezone="America/Santiago"),
            id="security_daily",
            name="Daily security check",
            replace_existing=True,
            max_instances=1,
        )

    # ==========================================
    # WEEKLY JOBS
    # ==========================================
    if security_agent:
        scheduler.add_job(
            security_agent.run_full_scan,
            CronTrigger(day_of_week="sun", hour=3, minute=0, timezone="America/Santiago"),
            id="security_weekly",
            name="Weekly full security scan",
            replace_existing=True,
            max_instances=1,
        )

    if content_agent:
        scheduler.add_job(
            content_agent.generate_coach_digest,
            CronTrigger(day_of_week="mon", hour=8, minute=0, timezone="America/Santiago"),
            id="coach_digest",
            name="Generate weekly coach digest",
            replace_existing=True,
            max_instances=1,
        )

    if growth_agent:
        scheduler.add_job(
            growth_agent.run_weekly_report,
            CronTrigger(day_of_week="fri", hour=17, minute=0, timezone="America/Santiago"),
            id="weekly_growth_report",
            name="Weekly growth report",
            replace_existing=True,
            max_instances=1,
        )

    # ==========================================
    # POST-DEPLOY TEST (triggered manually)
    # ==========================================
    if test_agent:
        # Not scheduled — triggered by webhook
        pass

    logger.info(f"[Scheduler] Initialized with {len(scheduler.get_jobs())} jobs")
    return scheduler


async def _keep_alive():
    """Ping al propio servidor para evitar que Render duerma el dyno."""
    import httpx
    import os

    render_url = os.getenv("RENDER_EXTERNAL_URL", "http://localhost:8000")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.get(f"{render_url}/health")
            logger.debug("[Scheduler] Keep-alive ping OK")
    except Exception:
        pass  # Silent fail — no es critico


@asynccontextmanager
async def scheduler_lifespan(app):
    """
    Lifespan context manager para APScheduler.
    Se integra con FastAPI lifespan.
    """
    global scheduler
    if scheduler:
        scheduler.start()
        logger.info("[Scheduler] Started")
    yield
    if scheduler:
        scheduler.shutdown()
        logger.info("[Scheduler] Shut down")


def get_scheduler() -> AsyncIOScheduler:
    """Get scheduler instance."""
    return scheduler


def get_all_jobs_status() -> list:
    """Get status of all scheduled jobs."""
    if not scheduler:
        return []

    jobs = scheduler.get_jobs()
    return [
        {
            "id": job.id,
            "name": job.name,
            "next_run": str(job.next_run_time) if job.next_run_time else "never",
            "trigger": str(job.trigger),
        }
        for job in jobs
    ]
