# WorkLearn

[![CI](https://github.com/Sikorsky3301/WorkLearn/actions/workflows/ci.yml/badge.svg)](https://github.com/Sikorsky3301/WorkLearn/actions/workflows/ci.yml)

An AI-managed career-simulation learning platform. Students get "hired" into
realistic job simulations at fictional companies, complete real work assigned
by an in-simulation manager, get it graded (AI for open-ended work, rule-based
checks for structured/code work), and earn XP, verified skill points, and
badges that roll up into a shareable, recruiter-facing Portfolio.

## Repo layout

This is a monorepo with two top-level apps plus supporting infra:

```
backend/          FastAPI (Python) API — see backend/ARCHITECTURE.md for the scaling plan
frontend/         React + Vite web app
k8s/              Kubernetes manifests (local Docker-Desktop-K8s today — see k8s/README.md)
docker-compose.yml   Local dev: LiteLLM Proxy + its DB, optionally Postgres + backend (see below)
docs/             Supporting docs that don't belong in the above — see docs/README.md
```

### `backend/`

```
app/
  core/            Config, auth (JWT/password hashing), permission dependencies,
                   request-ID middleware, logging setup — cross-cutting, not domain logic
  db/              SQLAlchemy engine/session setup (database.py)
  models/          SQLAlchemy models as a package — __init__.py holds the core
                   User/Enrollment/etc. tables, cms.py/rbac.py/sim_builder.py/
                   feature_flags.py/platform_config.py/profile.py split by feature area
  schemas/         Pydantic request/response shapes, same per-feature split as models/
  utils/           Generic, domain-agnostic helpers (empty until something earns its way in)
  routes/
    v1/            Every resource route, versioned — auth, admin, enrollments, sandbox, ...
    health.py      Deliberately unversioned — orchestrators/monitoring shouldn't need
                   to know about API versioning just to check the process is up
  services/        Business logic (skill_engine, permissions_seed, audit, ...)
  services/graders/  Per-task-type grading logic, including the declarative-rules DSL
  ai/              Everything that exists *because* of AI — routes/ + services/,
                   including llm.py (the unified litellm-based provider client)
migrations/        Numbered one-off SQL migrations (schema changes create_all can't express)
sandboxes/         Docker images for the code-execution sandbox (Python + frontend/JS)
litellm-proxy/     Optional standalone AI gateway config — see its own README
tests/             pytest suite — see "Testing" below
```

### `frontend/`

```
src/
  app/               Route-level page components only, grouped by access tier —
                      each file is a thin re-export of the real component in
                      features/ (App.jsx's <Routes> imports from here, not
                      straight from features/, so a route's access tier is
                      visible from its import path alone). Organizational only:
                      this is Vite + React Router, not Next.js App Router — no
                      file-based routing, no URL changes.
    (public)/          Reachable without being logged in, not part of the auth flow
    (auth)/            The login flow itself — one page per portal's entry point
    (dashboard)/       Everything behind authentication (including the Admin/
                       SuperAdmin portals — see the lazy() wrappers in this folder)
  features/          One folder per feature area's real implementation (dashboard,
                      portfolio, onboarding, admin-portal, super-admin-portal,
                      simulations, ai-mentor, mira, ...) — app/ imports from here
  hooks/             React Query hooks, one file per domain (barrel re-export
                      via index.js, so existing `from '.../hooks'` imports never
                      needed to change as the split grew)
  lib/               fetch client (client.js) + small pure helpers (domainIcons,
                      domainMeta, cn, ...)
  stores/            Zustand stores (useGenericSimStore, useCrmSimStore)
  types/             Placeholder for shared JSDoc typedefs (plain JS, not TS)
  shared/
    design-system/  Admin/SuperAdmin-portal-only components (their own dark mode scope)
    ui/             Shared primitives (shadcn-style components, etc.)
```

## Tech stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router, TanStack Query, Zustand
- **Backend**: FastAPI (async), SQLAlchemy (asyncpg), PostgreSQL, JWT auth
- **AI**: a unified client (litellm) supporting Anthropic, Groq, Gemini, or any
  OpenAI-Chat-Completions-compatible endpoint — switchable via one `.env` value,
  with an optional standalone LiteLLM Proxy gateway for production (see
  `backend/litellm-proxy/README.md`)
- **Observability**: Langfuse tracing on every AI call (cost, latency, tokens)
- **Sandboxing**: student code submissions run in isolated, resource-limited
  Docker containers (or Kubernetes Jobs in-cluster) — see `backend/sandboxes/`
- **Infra**: Docker, Kubernetes (local Docker-Desktop today — see `k8s/README.md`
  for exactly what would need to change for a real cloud cluster)

## Getting started

### Backend

```
cd backend
python -m venv wvenv
wvenv\Scripts\activate        # Windows; `source wvenv/bin/activate` on macOS/Linux
pip install -r requirements.txt
cp .env.example .env          # then fill in DATABASE_URL, an AI provider key, etc.
python seed.py                # creates demo accounts (see "Demo accounts" below)
uvicorn app.main:app --reload --port 3001
```

### Frontend

```
cd frontend
npm install
cp .env.example .env.local    # defaults to http://localhost:3001
npm run dev
```

Frontend expects the backend on `http://localhost:3001` by default (`VITE_API_URL`).

### Demo accounts (from `backend/seed.py`)

| Role | Login | Credentials |
|---|---|---|
| Direct User | `/login` | `demo@worklearn.ai` / `demo123` |
| SuperAdmin | `/super-admin` | `admin@worklearn.ai` / `admin123` |
| University Student | `/university/login` | `21CS001` / `student123` |
| Class Mentor | `/mentor/login` | `MENTOR001` / `mentor123` |

Admin accounts have no seeded default — create one from the SuperAdmin's Admin
Management page after logging in as SuperAdmin.

## Testing

```
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

See `backend/tests/README.md` and `frontend/src/test/README.md` for what's
actually covered — this is a real but intentionally-scoped suite (critical
paths: auth, RBAC enforcement, grading logic, a few pure utils/components),
not full coverage of every route/component.

CI (`.github/workflows/ci.yml`) runs both suites plus a frontend production
build on every push/PR to `main`.

## Running the full stack with Docker

`docker-compose.yml` covers Postgres + the backend + the optional LiteLLM
Proxy. The frontend is deliberately **not** containerized here (same
convention as `k8s/README.md` uses) — a Vite dev server has nothing to gain
from a container for local dev, so keep running it with `npm run dev`.

```
docker compose --env-file backend/.env up -d postgres backend
```

Add `litellm-proxy litellm-proxy-db` to that command if you also want the AI
gateway running (see `backend/litellm-proxy/README.md`).

## Deploying to Kubernetes

See `k8s/README.md` — covers the backend, sandbox execution, and the
LiteLLM Proxy. Read the "Known local-only limitations" and "Production
Notes" sections before treating this as more than a local dev/staging setup.

## Further reading

- [`backend/ARCHITECTURE.md`](backend/ARCHITECTURE.md) — scaling plan for 2000+ concurrent users
- [`k8s/README.md`](k8s/README.md) — Kubernetes deployment
- [`backend/litellm-proxy/README.md`](backend/litellm-proxy/README.md) — the AI gateway
- [`backend/sandboxes/README.md`](backend/sandboxes/README.md) — code-execution sandbox images
- [`docs/`](docs/README.md) — everything else (design proposals, route maps, test data)
