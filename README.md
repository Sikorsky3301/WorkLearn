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
  core/            Config, auth (JWT/password hashing), permissions.py (require_permission +
                   the Role enum re-export — RBAC's one canonical import), request-ID
                   middleware, logging setup, canonical filesystem paths — cross-cutting,
                   not domain logic
  db/              SQLAlchemy engine/session setup (database.py)
  models/          SQLAlchemy models as a package — __init__.py holds the core
                   User/Enrollment/etc. tables, cms.py/rbac.py/sim_builder.py/
                   feature_flags.py/platform_config.py/profile.py/certificate.py
                   split by feature area
  schemas/         Pydantic request/response shapes, same per-feature split as models/
  utils/           Generic, domain-agnostic helpers (empty until something earns its way in)
  api/
    v1/            Every resource route, versioned and grouped by RBAC domain —
                   auth/, users/ (profile, certificates), simulations/ (enrollments,
                   sandbox, agent_messages), builder/ (the CMS's sim-builder API),
                   admin/, superadmin/, analytics/, mentor/
  routes/
    health.py      Deliberately unversioned, sits alongside api/v1/ — orchestrators/
                   monitoring shouldn't need to know about API versioning just to
                   check the process is up
  services/        Business logic (skill_engine, permissions_seed, certificates,
                   simulation_completion, audit, ...)
  services/graders/  Per-task-type grading logic, including the declarative-rules DSL
  services/sandbox_runners/  Docker/Kubernetes execution backends for code-sandbox tasks
  ai/              Everything that exists *because* of AI — routes/ + services/,
                   including llm.py (the unified litellm-based provider client)
  agents/          Deterministic scheduler (reminders/deadline checks) — not an
                   LLM agent framework, despite the name
  cms_templates/   Starter templates for the Simulation CMS builder (one per domain)
migrations/        Numbered one-off SQL migrations (schema changes create_all can't express)
sandboxes/         Docker images for the code-execution sandbox (Python + frontend/JS)
litellm-proxy/     Optional standalone AI gateway config — see its own README
tests/             pytest suite — see "Testing" below
```

### `frontend/`

```
src/
  app/
    providers/       App-wide provider nesting — QueryClient, AuthProvider, the
                      top-level error boundary, the toast host (see AppProviders.jsx,
                      mounted once from main.jsx)
    router/           The route table (AppRouter.jsx — plain Vite + React Router,
                      not Next.js App Router, no file-based routing) plus guards/
                      (ProtectedRoute, RequireAdmin, RequireSuperAdmin, PortalSpinner)
    store/            Zustand stores (useGenericSimStore, useCrmSimStore)
  rbac/               Role/permission constants mirroring the backend's Role enum and
                      permission catalog (roles.js, permissions.js) plus a
                      usePermission.js hook — one canonical source instead of raw
                      string literals scattered across guards/components
  features/           One folder per feature area's real implementation. Most are
                      flat (dashboard, simulations, auth, ai-mentor, mira, onboarding,
                      skill-gps, analytics, community, mentor, portfolio's sibling
                      settings, ...); four are grouped by RBAC domain to mirror the
                      backend's api/v1/ split:
                        admin/       portal/ (Admin portal UI) + shared/ (components
                                     also reused by the SuperAdmin portal)
                        superadmin/  SuperAdmin portal UI
                        users/       portfolio/ + settings/ — the logged-in user's
                                     own account/profile surface
                        builder/     Simulation CMS + drag-drop Sim Builder
                                     (admin-authoring tools)
                      AppRouter imports each feature's top-level component directly.
  components/         Design-system + shared UI primitives (design-system/ — PortalShell,
                      Sidebar, DataTable, PermissionGate, ...; ui/ — shadcn-style
                      primitives; plus Footer/Navbar/NotFound)
  hooks/              React Query hooks, one file per domain (barrel re-export
                      via index.js, so existing `from '.../hooks'` imports never
                      needed to change as the split grew)
  lib/                fetch client (client.js), small pure helpers (domainIcons,
                      domainMeta, cn, simBranding), pdf/ (lazy-loaded credential
                      PDF generation — kept out of the main bundle)
  styles/             index.css — Tailwind directives + base/component layers
  types/              Placeholder for shared JSDoc typedefs (plain JS, not TS)
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

**Password for every seeded account:** `password`

Full host / role matrix: [`docs/TEST_LOGINS.md`](docs/TEST_LOGINS.md).

| Role | Login | Credentials |
|---|---|---|
| Academy student | `/login` on `localhost:5173` | `demo@worklearn.ai` / `password` |
| Super Admin | `/super-admin` | `admin@worklearn.ai` / `password` |
| Platform Admin | `/admin` on `localhost:5173` | `platform@worklearn.ai` / `password` |
| University Admin | `/admin` on `iitd.localhost:5173` → `/university-admin` | `uniadmin@worklearn.ai` / `password` |
| University student | `/university/login` on `iitd.localhost:5173` | `rahul@iitd.ac.in` / `password` |
| Teacher | `/mentor/login` on `iitd.localhost:5173` | `ananya@iitd.ac.in` / `password` |

Platform Admin and University Admin are **different roles** — see [`docs/TEST_LOGINS.md`](docs/TEST_LOGINS.md).

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
