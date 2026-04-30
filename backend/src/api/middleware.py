"""
Middleware de logging y seguridad para Holy Oly API.
"""
import time
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("holy-oly-security")

class SecurityLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware para logging de requests y detección de actividad sospechosa.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Obtener información del request
        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Loggear request
        logger.info(f"REQUEST - {method} {path} - IP: {client_ip} - UA: {user_agent}")
        
        # Detectar patrones sospechosos
        if self._is_suspicious(path, user_agent):
            logger.warning(f"SUSPICIOUS REQUEST - {method} {path} - IP: {client_ip}")
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Loggear response
            logger.info(
                f"RESPONSE - {method} {path} - "
                f"Status: {response.status_code} - "
                f"Time: {process_time:.3f}s"
            )
            
            # Agregar headers de seguridad
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
            return response
            
        except Exception as e:
            logger.error(f"ERROR - {method} {path} - Error: {str(e)}")
            raise
    
    def _is_suspicious(self, path: str, user_agent: str) -> bool:
        """Detecta patrones de requests sospechosos."""
        suspicious_patterns = [
            ".env", ".git", ".sql", "wp-admin", "phpmyadmin",
            "/admin", "/config", "/backup", ".php", "/cgi-bin/"
        ]
        
        path_lower = path.lower()
        return any(pattern in path_lower for pattern in suspicious_patterns)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware simple para rate limiting en memoria.
    En producción, usar Redis para rate limiting distribuido.
    """
    
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}  # IP -> [(timestamp, count), ...]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Limpiar requests antiguos
        if client_ip in self.requests:
            self.requests[client_ip] = [
                (ts, count) for ts, count in self.requests[client_ip]
                if current_time - ts < self.window_seconds
            ]
        else:
            self.requests[client_ip] = []
        
        # Contar requests en la ventana
        total_requests = sum(count for ts, count in self.requests[client_ip])
        
        if total_requests >= self.max_requests:
            logger.warning(f"RATE LIMIT EXCEEDED - IP: {client_ip}")
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again later."}
            )
        
        # Agregar request actual
        self.requests[client_ip].append((current_time, 1))
        
        return await call_next(request)
