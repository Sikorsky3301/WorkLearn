# Minimal, locked-down Python sandbox for grading student submissions.
# No network tools, no compilers, non-root user, no shell utilities beyond
# what pandas/numpy/scipy need at import time.
FROM python:3.12-slim

RUN pip install --no-cache-dir \
        pandas==2.2.3 \
        numpy==2.1.3 \
        matplotlib==3.9.2 \
        scipy==1.14.1 \
        statsmodels==0.14.4 \
    && useradd --no-create-home --uid 10001 sandboxuser

COPY entrypoint.py /opt/sandbox/entrypoint.py

# Avoid the "not a writable directory" matplotlib warning polluting stderr
# (sandboxuser has no home dir) — /workspace is the writable bind mount.
ENV MPLCONFIGDIR=/workspace/.mplcache

WORKDIR /workspace
USER sandboxuser

ENTRYPOINT ["python", "/opt/sandbox/entrypoint.py"]
