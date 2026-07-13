# Minimal, locked-down frontend sandbox for grading student HTML/CSS/JS/React
# submissions against hidden Jest specs. No network tools, no shell utilities
# beyond what Jest/jsdom need at import time, non-root user.
FROM node:20-slim

WORKDIR /opt/sandbox

COPY package.json ./
RUN npm install --omit=optional --no-audit --no-fund \
    && useradd --no-create-home --uid 10001 sandboxuser

COPY entrypoint.js babel.config.js jest.config.js jest.setup.js ./

WORKDIR /workspace
USER sandboxuser

ENTRYPOINT ["node", "/opt/sandbox/entrypoint.js"]
