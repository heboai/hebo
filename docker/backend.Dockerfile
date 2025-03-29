FROM python:3.13-rc-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    nodejs \
    npm

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY backend/pyproject.toml ./pyproject.toml

# Set environment variables for UV
ENV UV_SYSTEM_PYTHON=1
ENV UV_CACHE_DIR=/root/.cache/uv

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system -r pyproject.toml gunicorn

# Copy the project
COPY backend .

# Build static assets during build phase
RUN npm install && npm run build

# Create a non-root user
RUN useradd -m -u 1000 app

# Create and set ownership of the static directory
RUN mkdir -p /app/staticfiles && chown -R app:app /app/staticfiles && python /app/manage.py collectstatic --noinput

# Runtime stage
FROM python:3.13-rc-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 && rm -rf /var/lib/apt/lists/*

# Copy project files and Python packages from builder
COPY --from=builder --chown=app:app /app /app
COPY --from=builder --chown=app:app /usr/local /usr/local

# Set environment variables
ENV PYTHONPATH="/app:$PYTHONPATH"
ENV DJANGO_SETTINGS_MODULE="settings"

WORKDIR /app

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]