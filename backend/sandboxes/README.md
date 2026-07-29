# Sandbox images

One-time host setup — the machine running the FastAPI backend needs a Docker
daemon installed, and this image built and tagged before sandbox submissions
will work:

```
docker build -t worklearn-sandbox-python:latest backend/sandboxes/python
```

Rebuild whenever `sandboxes/python/Dockerfile` or `entrypoint.py` change.

Verify:

```
docker run --rm worklearn-sandbox-python:latest python -c "import pandas, numpy, scipy, statsmodels; print('ok')"
```

Same for the frontend sandbox (used by the Frontend Developer job simulation):

```
docker build -t worklearn-sandbox-frontend:latest backend/sandboxes/frontend
```

Rebuild whenever `sandboxes/frontend/Dockerfile`, `entrypoint.js`, or the Jest/Babel configs change.

Verify:

```
docker run --rm worklearn-sandbox-frontend:latest node -e "require('jest'); require('react'); console.log('ok')"
```
