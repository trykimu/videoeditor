FROM python:3.12.7-slim

# curl for healthchecks; uv installed via pip.
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir uv

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-dev

COPY . .

# Run as a non-root user.
RUN useradd --system --uid 1001 --create-home appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 3000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
