# The sandbox grader shells out to `docker run` on the HOST's daemon (see
# app/services/sandbox_runners/docker_runner.py) — each submission gets its
# own sibling container, not something nested inside this one. That needs the
# `docker` CLI binary in this image (copied from the official CLI-only image
# below, no apt repo/key setup required) plus the host's docker.sock bind-mounted
# in at runtime (see docker-compose.yml's `backend` service). The images that
# CLI invokes (worklearn-sandbox-python, worklearn-sandbox-frontend) must be
# built directly on the HOST's daemon separately — see backend/sandboxes/README.md.
FROM docker:26-cli AS docker-cli

FROM python:3.11-slim

WORKDIR /app

COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ app/
COPY seed.py migrate_legacy_sims.py ./

EXPOSE 3001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3001"]
