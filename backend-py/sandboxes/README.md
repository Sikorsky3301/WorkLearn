# Sandbox images

One-time host setup — the machine running the FastAPI backend needs a Docker
daemon installed, and this image built and tagged before sandbox submissions
will work:

```
docker build -t worklearn-sandbox-python:latest backend-py/sandboxes/python
```

Rebuild whenever `sandboxes/python/Dockerfile` or `entrypoint.py` change.

Verify:

```
docker run --rm worklearn-sandbox-python:latest python -c "import pandas, numpy, scipy, statsmodels; print('ok')"
```
