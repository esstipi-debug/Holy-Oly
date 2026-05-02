"""
GitHub Research Agent — Busca repos, herramientas, y skills utiles.
Cualquier agente puede usar esto para encontrar soluciones a problemas.
"""

import logging
import httpx
from typing import Optional

logger = logging.getLogger("motor25.research")

GITHUB_API = "https://api.github.com"
GITHUB_TOKEN = None  # Set from env var (aumenta rate limit de 60 a 5000 req/hora)


class GitHubResearcher:
    """
    Agente de investigacion que busca en GitHub repos, herramientas, y soluciones.

    Usa la API de GitHub para encontrar:
    - Repositorios relevantes para un problema
    - Librerias Python/Node para tareas especificas
    - Ejemplos de implementacion
    - Workflows de CI/CD
    - Herramientas de testing, seguridad, etc.
    """

    def __init__(self, token: str = None):
        self.token = token or GITHUB_TOKEN

    async def search_repos(self, query: str, language: str = None,
                            stars_min: int = 100, sort: str = "stars") -> list:
        """
        Buscar repositorios relevantes.

        Args:
            query: termino de busqueda (ej: "fastapi rate limiting")
            language: filtrar por lenguaje (python, javascript, etc.)
            stars_min: minimo de estrellas (default 100)
            sort: criterio (stars, forks, updated)

        Returns:
            Lista de repos con nombre, estrellas, descripcion, url
        """
        q = f"{query} stars:>={stars_min}"
        if language:
            q += f" language:{language}"

        url = f"{GITHUB_API}/search/repositories"
        params = {
            "q": q,
            "sort": sort,
            "order": "desc",
            "per_page": 10,
        }

        headers = {"Accept": "application/vnd.github+json"}
        if self.token:
            headers["Authorization"] = f"token {self.token}"

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, params=params, headers=headers)
                resp.raise_for_status()
                data = resp.json()

                repos = []
                for item in data.get("items", [])[:5]:
                    repos.append({
                        "name": item["full_name"],
                        "description": item.get("description", ""),
                        "stars": item["stargazers_count"],
                        "language": item.get("language", ""),
                        "url": item["html_url"],
                        "topics": item.get("topics", []),
                        "updated": item.get("updated_at", ""),
                    })

                logger.info(f"[GitHubResearcher] Found {len(repos)} repos for: {query}")
                return repos

        except Exception as e:
            logger.error(f"[GitHubResearcher] Search failed: {e}")
            return []

    async def search_trending(self, language: str = "python", since: str = "weekly") -> list:
        """Buscar repos trending en GitHub."""
        url = f"{GITHUB_API}/search/repositories"
        params = {
            "q": f"created:>{self._date_weeks_ago(1)}" if since == "weekly" else f"created:>{self._date_weeks_ago(4)}",
            "sort": "stars",
            "order": "desc",
            "per_page": 10,
        }
        if language:
            params["q"] += f" language:{language}"

        headers = {"Accept": "application/vnd.github+json"}
        if self.token:
            headers["Authorization"] = f"token {self.token}"

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, params=params, headers=headers)
                resp.raise_for_status()
                data = resp.json()

                return [
                    {
                        "name": item["full_name"],
                        "stars": item["stargazers_count"],
                        "description": item.get("description", ""),
                        "url": item["html_url"],
                    }
                    for item in data.get("items", [])[:5]
                ]
        except Exception as e:
            logger.error(f"[GitHubResearcher] Trending search failed: {e}")
            return []

    async def find_workflow_examples(self, workflow_type: str) -> list:
        """Buscar ejemplos de GitHub Actions workflows."""
        queries = {
            "deploy_render": "filename:render.yaml path:.github/workflows",
            "deploy_docker": "filename:docker-compose path:.github/workflows",
            "ci_python": "filename:ci.yml OR filename:test.yml language:python",
            "security_scan": "filename:security.yml OR filename:codeql path:.github/workflows",
            "email_automation": "resend OR sendgrid path:.github/workflows",
        }

        query = queries.get(workflow_type, workflow_type)
        return await self.search_repos(query, language="python", stars_min=10)

    async def find_library(self, task: str, language: str = "python") -> list:
        """
        Buscar librerias para una tarea especifica.

        Ejemplos:
        - task: "send transactional emails"
        - task: "scheduled jobs cron"
        - task: "rate limiting middleware"
        """
        return await self.search_repos(f"{task} library {language}", language=language, stars_min=50)

    def _date_weeks_ago(self, weeks: int) -> str:
        """Get date N weeks ago in YYYY-MM-DD format."""
        from datetime import datetime, timedelta
        date = datetime.utcnow() - timedelta(weeks=weeks * 7)
        return date.strftime("%Y-%m-%d")

    async def summarize_for_agent(self, query: str, purpose: str) -> str:
        """
        Buscar y resumir resultados para un agente.
        Retorna un resumen formateado que el agente puede usar.
        """
        repos = await self.search_repos(query)

        if not repos:
            return f"No se encontraron repos para: {query}"

        lines = [f"Resultados para '{query}':", ""]
        for i, repo in enumerate(repos, 1):
            lines.append(f"{i}. **{repo['name']}** ({repo['stars']} ⭐)")
            lines.append(f"   {repo['description']}")
            lines.append(f"   {repo['url']}")
            lines.append("")

        return "\n".join(lines)


# Singleton instance
_github_researcher: Optional[GitHubResearcher] = None


def get_researcher() -> GitHubResearcher:
    global _github_researcher
    if _github_researcher is None:
        _github_researcher = GitHubResearcher()
    return _github_researcher
