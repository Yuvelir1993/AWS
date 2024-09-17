FROM python:3.12.6-alpine AS builder

RUN pip install poetry==1.8.3

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

WORKDIR /app

COPY pyproject.toml poetry.lock ./

RUN poetry install --no-interaction && rm -rf $POETRY_CACHE_DIR

FROM python:3.12.6-alpine AS runtime

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

COPY s3_api ./s3_api

ARG API_PORT=5000

ENV API_PORT=${API_PORT}

EXPOSE ${API_PORT}

ENTRYPOINT ["python", "-m", "s3_api.api"]