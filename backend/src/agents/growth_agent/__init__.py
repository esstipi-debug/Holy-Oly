"""
Growth Agent — Engagement, churn, pricing, emails, referrals, A/B tests.
"""

import logging
import time
import random
from datetime import datetime, timedelta
from typing import Optional

import httpx

from agents.base import BaseAgent, AgentName, AgentResult, AgentDecision, RiskLevel, ActionMode

logger = logging.getLogger("motor25.growth")


# ============================================================
# EMAIL TEMPLATES
# ============================================================

TRIAL_REMINDER_TEMPLATES = {
    "day1": {
        "subject": "Bienvenido a HolyOly! Tu trial de 7 dias comenzo 🚀",
        "body": """
<html>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2 style="color: #1a1a2e;">Hola {name}! 👋</h2>
<p>Tu trial gratuito de <strong>HolyOly</strong> esta activo. Tienes <strong>7 dias</strong> para explorar todo.</p>

<h3 style="color: #16213e;">Que puedes hacer hoy:</h3>
<ul>
<li>🏋️ Crear tu primer entrenamiento IA</li>
<li>📊 Ver tu plan nutricional personalizado</li>
<li>💪 Probar el coach motivacional</li>
</ul>

<p style="background: #f0f4ff; padding: 15px; border-radius: 8px;">
<strong>Tip:</strong> Los usuarios que entrenan 3 veces esta semana tienen un 80% mas de retencion.
</p>

<a href="{app_url}" style="display: inline-block; background: #6c5ce7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
Ir a mi dashboard →
</a>

<p style="color: #666; font-size: 14px;">
Cualquier duda, responde este email. Estamos aqui para ayudarte.<br>
<strong>Equipo HolyOly</strong>
</p>
</body>
</html>
""",
    },
    "day7": {
        "subject": "{name}, quedan 7 dias de tu trial — No te pierdas esto!",
        "body": """
<html>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2 style="color: #1a1a2e;">Hola {name}! 🔥</h2>
<p>Tu trial esta por la mitad. <strong>Quedan 7 dias</strong> de acceso completo.</p>

<h3 style="color: #16213e;">Lo que mas te estas perdiendo:</h3>
<ul>
<li>📈 Seguimiento de progreso con graficos</li>
<li>🎯 Planes adaptados a tu nivel</li>
<li>🏆 Sistema de logros y desafios</li>
</ul>

<div style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
<strong>💡 Dato:</strong> Usuarios premium logran sus metas 3x mas rapido que sin plan.
</div>

<a href="{app_url}" style="display: inline-block; background: #00b894; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
Seguir entrenando →
</a>

<p style="color: #666; font-size: 14px;">
— Equipo HolyOly
</p>
</body>
</html>
""",
    },
    "day14": {
        "subject": "⏰ {name}, tu trial termina en 48 horas",
        "body": """
<html>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2 style="color: #1a1a2e;">Hola {name}! ⏰</h2>
<p>Tu trial gratuito <strong>termina en 2 dias</strong>. No queremos que pierdas tu progreso.</p>

<div style="border: 2px solid #fdcb6e; padding: 20px; border-radius: 12px; margin: 20px 0;">
<h3 style="margin-top: 0; color: #e17055;">Tu resumen:</h3>
<ul>
<li>Entrenamientos completados: <strong>{workouts}</strong></li>
<li>Dias activos: <strong>{active_days}</strong></li>
<li>Racha actual: <strong>{streak} dias</strong> 🔥</li>
</ul>
</div>

<h3 style="color: #16213e;">Planes disponibles:</h3>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr>
<td style="padding: 15px; background: #f8f9fa; border-radius: 8px; width: 50%;">
<strong>🥉 Basic</strong><br>
<span style="font-size: 24px; color: #6c5ce7;">$4.990/mes</span><br>
Entrenamientos IA + Plan nutricional
</td>
<td style="padding: 15px; background: #6c5ce7; color: white; border-radius: 8px; width: 50%;">
<strong>⭐ Pro (Popular)</strong><br>
<span style="font-size: 24px;">$9.990/mes</span><br>
Todo + Coach IA + Seguimiento avanzado
</td>
</tr>
</table>

<a href="{app_url}/pricing" style="display: inline-block; background: #6c5ce7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
Elegir mi plan →
</a>

<p style="color: #666; font-size: 14px;">
— Equipo HolyOly
</p>
</body>
</html>
""",
    },
}


WINBACK_TEMPLATES = {
    "first": {
        "subject": "Te extrañamos, {name}! 🥺",
        "body": """
<html>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2 style="color: #1a1a2e;">Hola {name}! 👋</h2>
<p>Hace un tiempo que no te vemos por HolyOly. <strong>Tu progreso sigue guardado</strong> y te esperamos.</p>

<div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
<strong>🎁 Regalo de bienvenida:</strong> 3 dias gratis de Premium para que vuelvas con todo!
</div>

<p>Usa el codigo: <code style="background: #f8f9fa; padding: 5px 10px; border-radius: 4px; font-size: 18px;">VUELVO2026</code></p>

<a href="{app_url}" style="display: inline-block; background: #6c5ce7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
Volver a entrenar →
</a>

<p style="color: #666; font-size: 14px;">
— Equipo HolyOly
</p>
</body>
</html>
""",
    },
    "second": {
        "subject": "Ultima chance, {name}! Tu codigo expira pronto ⏰",
        "body": """
<html>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2 style="color: #1a1a2e;">Hola {name}! ⏰</h2>
<p>Tu codigo <strong>VUELVO2026</strong> expira en <strong>48 horas</strong>. Es tu ultima oportunidad.</p>

<div style="background: linear-gradient(135deg, #e74c3c, #fd79a8); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
<h3 style="margin: 0;">3 DIAS PREMIUM GRATIS</h3>
<p style="margin: 10px 0 0 0;">Sin compromiso. Cancela cuando quieras.</p>
</div>

<a href="{app_url}?promo=VUELVO2026" style="display: inline-block; background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
Activar mi regalo →
</a>

<p style="color: #666; font-size: 14px;">
Si no es el momento, no hay problema. Te seguiremos mandando tips gratis!
<br><br>
— Equipo HolyOly
</p>
</body>
</html>
""",
    },
}


class GrowthAgent(BaseAgent):
    name = AgentName.GROWTH

    def __init__(self, db_pool=None, gemini_client=None, resend_api_key=None, app_url="https://holyoly.com", budget_manager=None):
        super().__init__(db_pool, gemini_client)
        self.resend_api_key = resend_api_key
        self.app_url = app_url
        self.budget_manager = budget_manager

    async def run(self, **kwargs) -> AgentResult:
        return await self.run_engagement_scores()

    # ============================================================
    # EMAIL SENDING (via Resend)
    # ============================================================

    async def _send_email(self, to: str, subject: str, body: str, user_id: str = None, campaign: str = None) -> dict:
        if self.budget_manager and not self.budget_manager.check_budget("growth_agent", "emails", 1):
            logger.warning("[Growth] Budget exceeded, email not sent")
            return {"error": "Budget exceeded"}

        if not self.resend_api_key:
            logger.warning("[Growth] No Resend API key, email not sent")
            return {"error": "No Resend API key"}

        headers = {
            "Authorization": f"Bearer {self.resend_api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "from": "HolyOly <hola@holyoly.com>",
            "to": [to],
            "subject": subject,
            "html": body,
        }

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post("https://api.resend.com/emails", json=payload, headers=headers)
                resp.raise_for_status()
                result = resp.json()
                logger.info(f"[Growth] Email sent to {to}: {result.get('id')}")

                if self.budget_manager:
                    self.budget_manager.spend("growth_agent", "email_sent", 1)

                if self.db_pool and campaign:
                    await self._log_email_sent(user_id, to, campaign, subject, result.get("id"))

                return result
        except Exception as e:
            logger.error(f"[Growth] Failed to send email to {to}: {e}")
            return {"error": str(e)}

    async def _log_email_sent(self, user_id, email, campaign, subject, resend_id):
        try:
            await self.db_pool.execute(
                "INSERT INTO email_logs (user_id, email_address, campaign_type, subject, sent_at, status) VALUES ($1, $2, $3, $4, NOW(), 'sent')",
                user_id, email, campaign, subject,
            )
        except Exception as e:
            logger.warning(f"[Growth] Failed to log email: {e}")

    # ============================================================
    # TRIAL REMINDERS
    # ============================================================

    async def run_trial_reminders(self) -> AgentResult:
        """Enviar emails de trial reminders (dias 1, 7, 14)."""
        start = time.time()

        if not self.db_pool:
            logger.warning("[Growth] No DB pool, skipping trial reminders")
            return AgentResult(success=False, agent_name=self.name, action="trial_reminders", error="No DB pool")

        try:
            now = datetime.utcnow()
            sent_count = 0

            # Day 1: Trial started today or yesterday
            day1_users = await self.db_pool.fetch(
                """
                SELECT id, email, name, created_at
                FROM users
                WHERE trial_ends_at > NOW()
                AND created_at >= NOW() - INTERVAL '2 days'
                AND email IS NOT NULL
                """,
            )

            for user in day1_users:
                template = TRIAL_REMINDER_TEMPLATES["day1"]
                body = template["body"].format(
                    name=user.get("name") or "campeon",
                    app_url=self.app_url,
                )
                await self._send_email(
                    to=user["email"],
                    subject=template["subject"].format(name=user.get("name") or "campeon"),
                    body=body,
                    user_id=user["id"],
                    campaign="trial_day1",
                )
                sent_count += 1

            # Day 7: Trial started 7 days ago
            day7_users = await self.db_pool.fetch(
                """
                SELECT id, email, name, created_at
                FROM users
                WHERE trial_ends_at > NOW()
                AND created_at >= NOW() - INTERVAL '8 days'
                AND created_at < NOW() - INTERVAL '6 days'
                AND email IS NOT NULL
                """,
            )

            for user in day7_users:
                template = TRIAL_REMINDER_TEMPLATES["day7"]
                body = template["body"].format(
                    name=user.get("name") or "campeon",
                    app_url=self.app_url,
                )
                await self._send_email(
                    to=user["email"],
                    subject=template["subject"].format(name=user.get("name") or "campeon"),
                    body=body,
                    user_id=user["id"],
                    campaign="trial_day7",
                )
                sent_count += 1

            # Day 14: Trial ends in 2 days
            day14_users = await self.db_pool.fetch(
                """
                SELECT id, email, name, trial_ends_at
                FROM users
                WHERE trial_ends_at BETWEEN NOW() AND NOW() + INTERVAL '2 days'
                AND email IS NOT NULL
                """,
            )

            for user in day14_users:
                # Get user stats
                stats = await self.db_pool.fetchrow(
                    """
                    SELECT COUNT(*) as workouts, COUNT(DISTINCT DATE(created_at)) as active_days
                    FROM workouts WHERE user_id = $1
                    """,
                    user["id"],
                )

                template = TRIAL_REMINDER_TEMPLATES["day14"]
                body = template["body"].format(
                    name=user.get("name") or "campeon",
                    workouts=stats.get("workouts", 0) if stats else 0,
                    active_days=stats.get("active_days", 0) if stats else 0,
                    streak=3,  # TODO: Calculate actual streak
                    app_url=self.app_url,
                )
                await self._send_email(
                    to=user["email"],
                    subject=template["subject"].format(name=user.get("name") or "campeon"),
                    body=body,
                    user_id=user["id"],
                    campaign="trial_day14",
                )
                sent_count += 1

            elapsed = int((time.time() - start) * 1000)
            logger.info(f"[Growth] Trial reminders sent: {sent_count}")

            return AgentResult(
                success=True,
                agent_name=self.name,
                action="trial_reminders",
                data={"sent": sent_count},
                execution_time_ms=elapsed,
            )

        except Exception as e:
            logger.error(f"[Growth] Trial reminders failed: {e}")
            return AgentResult(success=False, agent_name=self.name, action="trial_reminders", error=str(e))

    # ============================================================
    # WIN-BACK EMAILS
    # ============================================================

    async def run_winback_emails(self) -> AgentResult:
        """Enviar win-back emails a trials expirados."""
        start = time.time()

        if not self.db_pool:
            return AgentResult(success=False, agent_name=self.name, action="winback_emails", error="No DB pool")

        try:
            sent_count = 0

            # First win-back: trial expired 7-14 days ago, no premium subscription
            first_winback_users = await self.db_pool.fetch(
                """
                SELECT id, email, name, trial_ends_at
                FROM users
                WHERE trial_ends_at < NOW() - INTERVAL '7 days'
                AND trial_ends_at >= NOW() - INTERVAL '14 days'
                AND subscription_status IS NULL OR subscription_status = 'expired'
                AND email IS NOT NULL
                """,
            )

            for user in first_winback_users:
                # Check if already sent first win-back
                already_sent = await self.db_pool.fetchrow(
                    "SELECT id FROM email_logs WHERE user_id = $1 AND campaign_type = 'winback_first'",
                    user["id"],
                )
                if already_sent:
                    continue

                template = WINBACK_TEMPLATES["first"]
                body = template["body"].format(
                    name=user.get("name") or "campeon",
                    app_url=self.app_url,
                )
                await self._send_email(
                    to=user["email"],
                    subject=template["subject"].format(name=user.get("name") or "campeon"),
                    body=body,
                    user_id=user["id"],
                    campaign="winback_first",
                )
                sent_count += 1

            # Second win-back: trial expired 30+ days ago, got first win-back 7+ days ago
            second_winback_users = await self.db_pool.fetch(
                """
                SELECT u.id, u.email, u.name
                FROM users u
                WHERE u.trial_ends_at < NOW() - INTERVAL '30 days'
                AND (u.subscription_status IS NULL OR u.subscription_status = 'expired')
                AND u.email IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM email_logs
                    WHERE user_id = u.id AND campaign_type = 'winback_first'
                    AND sent_at < NOW() - INTERVAL '7 days'
                )
                AND NOT EXISTS (
                    SELECT 1 FROM email_logs
                    WHERE user_id = u.id AND campaign_type = 'winback_second'
                )
                """,
            )

            for user in second_winback_users:
                template = WINBACK_TEMPLATES["second"]
                body = template["body"].format(
                    name=user.get("name") or "campeon",
                    app_url=self.app_url,
                )
                await self._send_email(
                    to=user["email"],
                    subject=template["subject"].format(name=user.get("name") or "campeon"),
                    body=body,
                    user_id=user["id"],
                    campaign="winback_second",
                )
                sent_count += 1

            elapsed = int((time.time() - start) * 1000)
            logger.info(f"[Growth] Win-back emails sent: {sent_count}")

            return AgentResult(
                success=True,
                agent_name=self.name,
                action="winback_emails",
                data={"sent": sent_count},
                execution_time_ms=elapsed,
            )

        except Exception as e:
            logger.error(f"[Growth] Win-back emails failed: {e}")
            return AgentResult(success=False, agent_name=self.name, action="winback_emails", error=str(e))

    # ============================================================
    # ENGAGEMENT SCORING
    # ============================================================

    async def run_engagement_scores(self) -> AgentResult:
        """Calcular engagement score 0-100 para cada usuario activo."""
        start = time.time()

        if not self.db_pool:
            return AgentResult(success=False, agent_name=self.name, action="engagement_scores", error="No DB pool")

        try:
            users = await self.db_pool.fetch(
                "SELECT id FROM users WHERE last_login_at IS NOT NULL AND last_login_at > NOW() - INTERVAL '30 days'",
            )

            scored = 0
            for user in users:
                score, components = await self._calculate_user_engagement(user["id"])

                await self.db_pool.execute(
                    """
                    INSERT INTO user_engagement_scores (user_id, score, components, calculated_at)
                    VALUES ($1, $2, $3, NOW())
                    """,
                    user["id"], score, components,
                )
                scored += 1

            elapsed = int((time.time() - start) * 1000)
            logger.info(f"[Growth] Engagement scores calculated for {scored} users")

            return AgentResult(
                success=True,
                agent_name=self.name,
                action="engagement_scores",
                data={"scored": scored},
                execution_time_ms=elapsed,
            )

        except Exception as e:
            logger.error(f"[Growth] Engagement scores failed: {e}")
            return AgentResult(success=False, agent_name=self.name, action="engagement_scores", error=str(e))

    async def _calculate_user_engagement(self, user_id: str) -> tuple[int, dict]:
        """
        Engagement score 0-100 basado en:
        - Login frequency (25 pts)
        - Workout completions (30 pts)
        - Feature usage (20 pts)
        - Session duration (15 pts)
        - Social interactions (10 pts)
        """
        # Login frequency (last 30 days)
        logins = await self.db_pool.fetchrow(
            "SELECT COUNT(*) as count FROM user_logins WHERE user_id = $1 AND login_at > NOW() - INTERVAL '30 days'",
            user_id,
        )
        login_count = logins["count"] if logins else 0
        login_score = min(25, int(login_count * 2.5))  # 10 logins = 25pts

        # Workout completions
        workouts = await self.db_pool.fetchrow(
            "SELECT COUNT(*) as count FROM workouts WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'",
            user_id,
        )
        workout_count = workouts["count"] if workouts else 0
        workout_score = min(30, int(workout_count * 3))  # 10 workouts = 30pts

        # Feature usage (unique features used)
        features = await self.db_pool.fetchrow(
            "SELECT COUNT(DISTINCT feature_name) as count FROM user_events WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'",
            user_id,
        )
        feature_count = features["count"] if features else 0
        feature_score = min(20, int(feature_count * 4))  # 5 features = 20pts

        # Session duration (avg minutes)
        sessions = await self.db_pool.fetchrow(
            "SELECT AVG(duration_minutes) as avg_duration FROM user_sessions WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'",
            user_id,
        )
        avg_duration = sessions["avg_duration"] if sessions and sessions["avg_duration"] else 0
        duration_score = min(15, int(avg_duration * 0.5))  # 30 min avg = 15pts

        # Social interactions
        social = await self.db_pool.fetchrow(
            "SELECT COUNT(*) as count FROM social_interactions WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'",
            user_id,
        )
        social_count = social["count"] if social else 0
        social_score = min(10, int(social_count * 2))  # 5 interactions = 10pts

        total = login_score + workout_score + feature_score + duration_score + social_score
        components = {
            "login_frequency": {"score": login_score, "max": 25, "raw": login_count},
            "workout_completions": {"score": workout_score, "max": 30, "raw": workout_count},
            "feature_usage": {"score": feature_score, "max": 20, "raw": feature_count},
            "session_duration": {"score": duration_score, "max": 15, "raw": avg_duration},
            "social_interactions": {"score": social_score, "max": 10, "raw": social_count},
        }

        return total, components

    # ============================================================
    # CHURN PREDICTION
    # ============================================================

    async def run_churn_prediction(self) -> AgentResult:
        """Predecir churn para todos los usuarios."""
        start = time.time()

        if not self.db_pool:
            return AgentResult(success=False, agent_name=self.name, action="churn_prediction", error="No DB pool")

        try:
            users = await self.db_pool.fetch(
                "SELECT id FROM users WHERE trial_ends_at IS NOT NULL OR subscription_status IS NOT NULL",
            )

            predicted = 0
            high_risk_count = 0
            for user in users:
                probability, factors, intervention = await self._predict_churn(user["id"])

                risk_level = "high" if probability > 0.7 else ("medium" if probability > 0.4 else "low")
                if risk_level == "high":
                    high_risk_count += 1

                await self.db_pool.execute(
                    """
                    INSERT INTO churn_predictions (user_id, churn_probability, risk_level, contributing_factors, intervention_suggested, predicted_at)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                    """,
                    user["id"], probability, risk_level, factors, intervention,
                )
                predicted += 1

            elapsed = int((time.time() - start) * 1000)
            logger.info(f"[Growth] Churn prediction: {predicted} users, {high_risk_count} high risk")

            return AgentResult(
                success=True,
                agent_name=self.name,
                action="churn_prediction",
                data={"predicted": predicted, "high_risk": high_risk_count},
                execution_time_ms=elapsed,
            )

        except Exception as e:
            logger.error(f"[Growth] Churn prediction failed: {e}")
            return AgentResult(success=False, agent_name=self.name, action="churn_prediction", error=str(e))

    async def _predict_churn(self, user_id: str) -> tuple[float, dict, dict]:
        """
        Churn probability basado en heuristicas simples.

        Factores de riesgo:
        - No login en 7+ dias
        - Trial expirando pronto sin conversion
        - Baja engagement score
        - No completaron onboarding
        """
        factors = {}
        probability = 0.0
        interventions = []

        # Check last login
        last_login = await self.db_pool.fetchrow(
            "SELECT last_login_at FROM users WHERE id = $1",
            user_id,
        )
        if last_login and last_login["last_login_at"]:
            days_since_login = (datetime.utcnow() - last_login["last_login_at"]).days
            if days_since_login > 7:
                probability += 0.3
                factors["inactive_days"] = days_since_login
                interventions.append("send_re_engagement_email")
            elif days_since_login > 3:
                probability += 0.15
                factors["inactive_days"] = days_since_login

        # Check engagement score
        latest_score = await self.db_pool.fetchrow(
            "SELECT score FROM user_engagement_scores WHERE user_id = $1 ORDER BY calculated_at DESC LIMIT 1",
            user_id,
        )
        if latest_score:
            score = float(latest_score["score"])
            if score < 30:
                probability += 0.25
                factors["engagement_score"] = score
                interventions.append("suggest_personalized_workout")
            elif score < 50:
                probability += 0.1
                factors["engagement_score"] = score

        # Check trial status
        trial_info = await self.db_pool.fetchrow(
            "SELECT trial_ends_at, subscription_status FROM users WHERE id = $1",
            user_id,
        )
        if trial_info:
            if trial_info["trial_ends_at"] and trial_info["trial_ends_at"] < datetime.utcnow():
                if not trial_info["subscription_status"] or trial_info["subscription_status"] == "expired":
                    probability += 0.35
                    factors["trial_expired"] = True
                    interventions.append("offer_discount")

            elif trial_info["trial_ends_at"]:
                days_left = (trial_info["trial_ends_at"] - datetime.utcnow()).days
                if days_left < 3:
                    probability += 0.2
                    factors["trial_ending_soon"] = days_left
                    interventions.append("send_conversion_email")

        # Check onboarding completion
        onboarding = await self.db_pool.fetchrow(
            "SELECT onboarding_completed FROM users WHERE id = $1",
            user_id,
        )
        if onboarding and not onboarding.get("onboarding_completed"):
            probability += 0.15
            factors["onboarding_incomplete"] = True
            interventions.append("nudge_onboarding")

        probability = min(1.0, probability)

        intervention = {
            "suggested_actions": interventions,
            "priority": "high" if probability > 0.7 else "medium" if probability > 0.4 else "low",
        }

        return probability, factors, intervention

    # ============================================================
    # A/B TEST FRAMEWORK
    # ============================================================

    async def create_experiment(self, name: str, experiment_type: str, variants: list[dict]) -> dict:
        """
        Crear un nuevo experimento A/B.

        Args:
            name: Nombre del experimento
            experiment_type: email, pricing, landing, feature
            variants: Lista de variantes [{"name": "A", "config": {...}}, ...]

        Returns:
            dict con experiment_id
        """
        if not self.db_pool:
            return {"error": "No DB pool"}

        experiment_id = None
        try:
            row = await self.db_pool.fetchrow(
                """
                INSERT INTO growth_experiments (name, experiment_type, status, variants, start_date, created_at)
                VALUES ($1, $2, 'active', $3, NOW(), NOW())
                RETURNING id
                """,
                name, experiment_type, variants,
            )
            experiment_id = row["id"]
            logger.info(f"[Growth] Experiment created: {name} ({experiment_id})")

            return {"experiment_id": str(experiment_id), "name": name, "status": "active"}

        except Exception as e:
            logger.error(f"[Growth] Failed to create experiment: {e}")
            return {"error": str(e)}

    async def assign_variant(self, user_id: str, experiment_id: str) -> Optional[str]:
        """
        Asignar variante a un usuario.

        Si ya tiene asignada, retorna la existente.
        Si no, asigna random weighted.
        """
        if not self.db_pool:
            return None

        try:
            # Check existing assignment
            existing = await self.db_pool.fetchrow(
                "SELECT variant_name FROM growth_user_experiments WHERE user_id = $1 AND experiment_id = $2",
                user_id, experiment_id,
            )
            if existing:
                return existing["variant_name"]

            # Get experiment variants
            exp = await self.db_pool.fetchrow(
                "SELECT variants FROM growth_experiments WHERE id = $1 AND status = 'active'",
                experiment_id,
            )
            if not exp:
                return None

            variants = exp["variants"]

            # Weighted random assignment
            weights = [v.get("weight", 1.0) for v in variants]
            total = sum(weights)
            normalized = [w / total for w in weights]

            r = random.random()
            cumulative = 0
            for i, weight in enumerate(normalized):
                cumulative += weight
                if r <= cumulative:
                    chosen = variants[i]["name"]
                    break
            else:
                chosen = variants[-1]["name"]

            # Save assignment
            await self.db_pool.execute(
                "INSERT INTO growth_user_experiments (user_id, experiment_id, variant_name, assigned_at) VALUES ($1, $2, $3, NOW())",
                user_id, experiment_id, chosen,
            )

            return chosen

        except Exception as e:
            logger.error(f"[Growth] Failed to assign variant: {e}")
            return None

    async def track_conversion(self, user_id: str, experiment_id: str) -> None:
        """Marcar que un usuario convirtio en un experimento."""
        if not self.db_pool:
            return

        try:
            await self.db_pool.execute(
                "UPDATE growth_user_experiments SET converted = TRUE WHERE user_id = $1 AND experiment_id = $2",
                user_id, experiment_id,
            )
        except Exception as e:
            logger.warning(f"[Growth] Failed to track conversion: {e}")

    async def get_experiment_results(self, experiment_id: str) -> dict:
        """Obtener resultados de un experimento."""
        if not self.db_pool:
            return {"error": "No DB pool"}

        try:
            exp = await self.db_pool.fetchrow(
                "SELECT name, experiment_type, status, variants FROM growth_experiments WHERE id = $1",
                experiment_id,
            )
            if not exp:
                return {"error": "Experiment not found"}

            # Get variant stats
            variant_stats = await self.db_pool.fetch(
                """
                SELECT variant_name, COUNT(*) as total, COUNT(*) FILTER (WHERE converted) as conversions
                FROM growth_user_experiments
                WHERE experiment_id = $1
                GROUP BY variant_name
                """,
                experiment_id,
            )

            results = {
                "experiment_id": str(experiment_id),
                "name": exp["name"],
                "type": exp["experiment_type"],
                "status": exp["status"],
                "variants": {},
            }

            for stat in variant_stats:
                total = stat["total"]
                conversions = stat["conversions"]
                rate = (conversions / total * 100) if total > 0 else 0
                results["variants"][stat["variant_name"]] = {
                    "total": total,
                    "conversions": conversions,
                    "conversion_rate": round(rate, 2),
                }

            return results

        except Exception as e:
            logger.error(f"[Growth] Failed to get experiment results: {e}")
            return {"error": str(e)}

    # ============================================================
    # PRICING ANALYSIS (Gemini)
    # ============================================================

    async def run_pricing_analysis(self) -> AgentResult:
        """Gemini analiza data y sugiere ajustes de pricing."""
        start = time.time()

        if not self.db_pool or not self.gemini_client:
            return AgentResult(success=False, agent_name=self.name, action="pricing_analysis", error="No DB or Gemini")

        try:
            # Get pricing data
            conversion_data = await self.db_pool.fetch(
                """
                SELECT
                    subscription_status,
                    COUNT(*) as count,
                    AVG(trial_ends_at - created_at) as avg_trial_duration
                FROM users
                GROUP BY subscription_status
                """,
            )

            prompt = f"""
Analiza estos datos de conversion y pricing de HolyOly (app fitness IA en Chile):

Datos:
{conversion_data}

Planes actuales:
- Basic: $4.990/mes (entrenamientos IA + plan nutricional)
- Pro: $9.990/mes (todo + coach IA + seguimiento avanzado)

Preguntas:
1. El pricing es adecuado para el mercado chileno?
2. Sugieres algun cambio en precios o estructura de planes?
3. Que features deberian estar en cada plan para maximizar conversion?
4. Sugieres algun plan anual o lifetime?

Responde en espanol, de forma concisa.
"""

            response = self.gemini_client.generate_content(prompt)
            analysis = response.text

            elapsed = int((time.time() - start) * 1000)
            logger.info("[Growth] Pricing analysis completed")

            return AgentResult(
                success=True,
                agent_name=self.name,
                action="pricing_analysis",
                data={"analysis": analysis},
                execution_time_ms=elapsed,
            )

        except Exception as e:
            logger.error(f"[Growth] Pricing analysis failed: {e}")
            return AgentResult(success=False, agent_name=self.name, action="pricing_analysis", error=str(e))

    # ============================================================
    # WEEKLY REPORT
    # ============================================================

    async def run_weekly_report(self) -> AgentResult:
        """Generar weekly growth report."""
        start = time.time()

        if not self.db_pool:
            return AgentResult(success=False, agent_name=self.name, action="weekly_report", error="No DB pool")

        try:
            # Aggregate metrics
            new_users = await self.db_pool.fetchrow(
                "SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '7 days'",
            )

            active_users = await self.db_pool.fetchrow(
                "SELECT COUNT(*) as count FROM users WHERE last_login_at > NOW() - INTERVAL '7 days'",
            )

            converted = await self.db_pool.fetchrow(
                "SELECT COUNT(*) as count FROM users WHERE subscription_status = 'active'",
            )

            emails_sent = await self.db_pool.fetchrow(
                "SELECT COUNT(*) as count FROM email_logs WHERE sent_at > NOW() - INTERVAL '7 days'",
            )

            report = {
                "period": "last_7_days",
                "new_users": new_users["count"] if new_users else 0,
                "active_users": active_users["count"] if active_users else 0,
                "converted_users": converted["count"] if converted else 0,
                "emails_sent": emails_sent["count"] if emails_sent else 0,
            }

            elapsed = int((time.time() - start) * 1000)
            logger.info(f"[Growth] Weekly report: {report}")

            return AgentResult(
                success=True,
                agent_name=self.name,
                action="weekly_report",
                data=report,
                execution_time_ms=elapsed,
            )

        except Exception as e:
            logger.error(f"[Growth] Weekly report failed: {e}")
            return AgentResult(success=False, agent_name=self.name, action="weekly_report", error=str(e))
