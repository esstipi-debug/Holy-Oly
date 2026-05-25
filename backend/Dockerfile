FROM python:3.11-slim

WORKDIR /app

# Build context = repo root. Por eso prefijamos con `backend/`.
# Esto funciona tanto si Render builda desde el root como si setean
# Root Directory=backend (en ese caso, los paths colapsan).

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY backend/src/ ./src/

# Render / Cloud Run usan PORT env var · default 8080 si no está seteado
ENV PORT=8080

CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port $PORT"]
