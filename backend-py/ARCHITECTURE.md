# WorkALearn @ 2000+ Users — Architecture, Student-Understanding AI, and Cost Plan

## Context

The platform today (as built through this session) is a single-process setup: one Vite-served React app, one FastAPI process talking to one Postgres database, and a Docker sandbox invoked directly (`docker run`) from inside the request handler for every code submission. That's the right shape for a prototype with a handful of test users. It is **not** the shape that survives 2000+ real students running Docker containers and chatting with an LLM mentor. This document is the plan for closing that gap: (1) how the sandbox and platform scale, (2) how the AI actually comes to "know" where a specific student is stuck, across all 2000+ of them, without re-deriving it from scratch on every question, and (3) what this realistically costs, priced against the actual Groq rates and hosting rates as of mid-2026 (not guessed).

---

## Part 1 — What "2000+ users" actually means (sizing assumptions)

Numbers below assume: 2000 registered accounts, ~25-30% monthly active (500-600 students actually working through a simulation in a given month), each doing 5 tasks with the sandbox (Tasks 1-4) or LLM judge (Task 5), with occasional re-runs. This is stated explicitly because every cost/capacity number downstream depends on it — if usage is heavier, scale linearly.

Peak concurrency (the number that actually stresses the sandbox) is not 2000 — it's however many students are mid-submission at the same moment. For a course-style rollout (a class or cohort working roughly the same week), realistic peak is **20-60 concurrent Docker runs**, not 2000. This distinction is the whole reason a naive "one container per request" model breaks before a "queued worker pool" model does — it's not the total user count that matters, it's the burst concurrency.

---

## Part 2 — Sandbox scaling (the part that actually breaks first)

**Today:** `app/services/sandbox.py` shells out to `docker run` synchronously inside the FastAPI request/response cycle, one container per submission, on whatever single host runs the backend.

**Why this breaks before anything else does:** each `docker run` costs real CPU/memory (256MB/0.5 CPU cap per container, per the existing `settings.sandbox_memory_limit`/`sandbox_cpu_limit`) plus ~1-2s container-startup overhead. A single host has a hard ceiling on simultaneous containers long before it has a ceiling on HTTP requests. If 40 students submit within the same minute (entirely plausible for a class), the naive model either queues them serially behind the request thread (multi-second latency spikes) or the host runs out of memory trying to run them all at once.

**Fix, in three tiers — implement in order, only move to the next tier when the trigger is actually hit:**

### Tier 1 (now → ~50 concurrent submissions): bounded worker pool, same host
Replace the direct synchronous `docker run` call with a small in-process job queue: an `asyncio.Semaphore(N)` (N = host's safe concurrent-container count, e.g. 6-10 on a 4-8 core box) gating submissions, plus a simple Postgres-backed `sandbox_jobs` table (`id, enrollment_id, task_id, code, status, result, created_at`) so a submission that arrives while the pool is full is queued, not rejected or blocked on an open HTTP connection. The API returns immediately with a job id; frontend polls `GET /api/sandbox/jobs/{id}` (or a short SSE stream) until `status = done`. This requires no new infrastructure — it reuses Postgres, which is already there — and directly fixes the "everyone hits Submit at 9pm the night before deadline" failure mode.

### Tier 2 (~50-300 concurrent submissions): dedicated worker service + real queue
Split the sandbox execution out of the API process entirely into its own worker service (still just a Python process, now running `N` replicas, each pulling jobs off a real queue — Redis + RQ, or Celery, given Redis is likely already being added for caching in Part 3 anyway). The API's only job becomes "enqueue and let the student know it's running" — this decouples sandbox load spikes from the responsiveness of the rest of the site (login, dashboard, AI Mentor chat stay fast even if the sandbox queue is backed up). Trigger to move here: Tier 1's queue wait time regularly exceeds ~15-20 seconds at peak.

### Tier 3 (300+ concurrent, or "stop operating Docker hosts yourself"): managed ephemeral-sandbox service
At real scale, hand the actual container orchestration to something built for exactly this problem — either Kubernetes Jobs (one pod per submission, cluster autoscaler handles bin-packing) if there's already Kubernetes operational expertise, or a managed sandbox-as-a-service API (e.g. **E2B**, **Modal**, **Daytona** — these exist specifically for "run untrusted user code safely, bill per second") if there isn't. The `run_submission()` function's *interface* (code in, artifact + stdout/stderr out) doesn't change — only what's behind it does, so Tiers 1→2→3 are swaps behind the same function signature, not rewrites of the grading logic.

**Important constraint to plan around now, not later:** most PaaS platforms (Render, Railway, Fly.io's shared runners) do **not** allow privileged/nested Docker execution inside your app's own container — you cannot `docker run` from inside a Render web service. This means the sandbox worker (Tier 1 or 2) needs either (a) a real VM with Docker installed (a small Hetzner/DigitalOcean box, ~$15-25/mo, is enough for Tier 1-2 volumes), or (b) skip straight to a managed sandbox API in Part 6's cost table. This is the one piece of the stack that can't just live on "whatever's cheapest" the way the API/DB can.

---

## Part 3 — Platform architecture (everything else)

```
                        ┌─────────────────┐
                        │   React (Vite)   │  static build → CDN (Cloudflare Pages /
                        │   frontend        │  Render Static / Vercel — all near-free)
                        └────────┬─────────┘
                                 │ HTTPS
                        ┌────────▼─────────┐
                        │  Load balancer /  │
                        │  reverse proxy    │  (built into Render/Railway/Fly)
                        └────────┬─────────┘
                 ┌───────────────┼────────────────┐
        ┌────────▼──────┐ ┌─────▼──────┐  ┌───────▼────────┐
        │  FastAPI API   │ │ FastAPI API │  │  FastAPI API   │   N stateless replicas,
        │  replica 1     │ │ replica 2   │  │  replica N     │   scale on CPU/req latency
        └────────┬───────┘ └─────┬──────┘  └───────┬────────┘
                  └───────────────┼──────────────────┘
              ┌───────────────────┼────────────────────┐
      ┌───────▼───────┐  ┌────────▼────────┐   ┌────────▼────────┐
      │  Postgres      │  │  Redis          │   │  Object storage │
      │  (+ PgBouncer) │  │  (queue, cache, │   │  (S3-compatible,│
      │  primary        │  │  rate limits)   │   │  e.g. R2)       │
      └────────────────┘  └─────────────────┘   └─────────────────┘
                  │
      ┌───────────▼────────────┐        ┌─────────────────────┐
      │  Sandbox worker pool    │        │  Groq LLM API        │
      │  (separate host/VM,     │◄───────┤  (AI Mentor chat +   │
      │  Docker-capable)        │        │  Task 5 judge)        │
      └─────────────────────────┘        └──────────────────────┘
```

Concrete changes from today's setup, each independently doable:

- **API**: stays FastAPI, but becomes stateless and horizontally replicated (no in-process state beyond what's already gone through the DB) — this is already mostly true today, the only work is deployment config, not code rewrites.
- **Postgres**: add **PgBouncer** (connection pooling) once replica count × SQLAlchemy pool size starts approaching Postgres's `max_connections` (default 100) — with async SQLAlchemy and multiple API replicas this is reached surprisingly fast, well before 2000 users, so it should be near the top of the actual implementation list, not a "someday" item.
- **Artifacts**: `backend-py/data/artifacts/{enrollment_id}/...` (local disk today) moves to S3-compatible object storage (Cloudflare R2 recommended — see cost table) — required as soon as there's more than one API/worker replica, since local disk isn't shared across them.
- **Redis**: one small addition that pulls double duty — job queue (Part 2 Tier 2) + rate limiting (protects the Groq API key's RPM/TPM limits from a runaway chat loop) + hot-path caching (leaderboards, skill trees).
- **Observability**: add structured logging + an error tracker (Sentry's free tier covers this scale) from day one of the multi-replica setup — this session's own debugging (the NaN serialization bug, the Windows subprocess bug) would have been caught by Sentry in seconds instead of requiring manual traceback archaeology. This is cheap insurance, not a "nice to have."

---

## Part 4 — How the AI actually understands where a student is stuck (the core ask)

This is a data-modeling problem before it's an AI problem. An LLM cannot "remember" 2000 students' histories inside its context window, and re-summarizing a student's entire history into every prompt is slow and expensive. The fix is the same one every real support/tutoring system uses: **write down what happened, and let the AI query it, rather than asking the AI to hold it in its head.**

### 4a. The activity event log (new table, the foundation)

Today, the only record of student progress is `TaskCompletion` — a snapshot ("task 2, score 87") written once, at the end. It has no memory of the *struggle* — how many times they ran the code, which specific checks kept failing, whether they looked at hints, how long they sat on one task. That struggle signal is exactly what "where did they get stuck" needs, and it doesn't exist yet.

New table, **append-only, one row per meaningful action**:

```sql
student_activity_events (
  id, enrollment_id, task_id, event_type, payload JSONB, created_at
)
```

`event_type` values: `task_opened`, `code_run` (dry_run=true — the "Run" button), `code_submitted`, `check_failed` (id, label — one row per failed check, from the grader's existing `checks[]` array, so this is nearly free to populate off data already computed), `hint_viewed`, `solution_revealed`, `ai_mentor_asked` (the question text), `task_completed`, `idle_timeout` (no activity for N minutes on an open task).

This is cheap to populate — nearly every one of these events is already a moment where the backend has the relevant data in hand (e.g. `sandbox.py`'s `submit` endpoint already computes `checks[]`; it just needs one extra `INSERT` per failed check instead of discarding that detail after grading). No new AI calls, no new infra — it's a logging discipline change plus one new table.

### 4b. Turning the log into "why is this student stuck" (structured context, not fine-tuning)

When a student asks the AI Mentor a question (or a mentor/instructor dashboard asks "who's stuck and on what"), the backend runs a **plain SQL query** — not an LLM call — over `student_activity_events` for that enrollment:

- Current task, time since `task_opened`
- Count of `code_submitted` events and how many `check_failed` rows attached to the most recent one (which specific checks, by label — "discount_pct normalized to a 0–1 scale" failing 4 times running is a much stronger signal than a bare low score)
- Whether `hint_viewed`/`solution_revealed` happened yet
- A short window of recent `ai_mentor_asked` questions, if any (so the mentor doesn't repeat itself)

This gets formatted into a compact **context block** (a few hundred tokens, not the full history) and injected into the existing `app/services/llm.py generate()` prompt alongside the student's actual question — the same "structured context injection" pattern the codebase almost certainly already uses for the AI Mentor's chat (reuse that injection point rather than building a second one). This is the entire mechanism: **no vector database, no embeddings, no fine-tuning** — a SQL query against a well-designed event log outperforms RAG for this use case because the data is structured and small per-student, and it's dramatically cheaper and more reliable (an LLM given "student failed check X 4 times" answers precisely; an LLM asked to "remember" that from a wall of raw chat history often doesn't).

**When to actually reach for embeddings/vector search instead:** only if free-text content needs *semantic* search across history — e.g., "find other students who asked something similar to this" for a mentor dashboard, or searching long Task 5 brief submissions by topic. That's a genuine future upgrade (Part 8), not a Day 1 requirement — don't build it until a concrete feature needs it.

### 4c. Aggregate view — "who's stuck across all 2000 students" (instructor/admin side)

The same event log, aggregated instead of filtered to one student, answers the platform-operator version of the same question with a materialized view or a scheduled query (no LLM involved at all): e.g. `SELECT task_id, check_id, count(*) FROM student_activity_events WHERE event_type='check_failed' AND created_at > now() - interval '7 days' GROUP BY 1,2 ORDER BY 3 DESC` surfaces "62% of students fail the discount_scale check on Task 1" — which is a curriculum signal (the task or its hints need work), distinct from the per-student tutoring signal in 4b, and just as valuable.

---

## Part 5 — AI cost estimate (grounded in current Groq pricing, not a guess)

Confirmed current on-demand pricing (Groq, mid-2026):

| Model | Input $/M tokens | Output $/M tokens | Use for |
|---|---|---|---|
| `llama-3.3-70b-versatile` (already in use) | $0.59 | $0.79 | AI Mentor chat, Task 5 LLM judge |
| `llama-3.1-8b-instant` | $0.05 | $0.08 | High-frequency/low-stakes nudges, if ever needed |
| Batch API (24h-7d turnaround) | ~50% off either | ~50% off either | Non-real-time aggregate jobs only |

**Monthly cost at 600 active students** (this session's sizing assumption, Part 1), using the platform's actual prompt shapes:

- Task 5 judge (`task5_brief.py`'s `JUDGE_PROMPT`, `max_tokens=150`): ~1,300 input + 150 output tokens per call. Assume 1.5 submissions/student average (resubmission after feedback) → 900 calls/month → **≈ $0.80/month**.
- AI Mentor chat: assume 10 exchanges/student on average, ~600 input (question + Part 4b context block) + 300 output tokens each → 6,000 exchanges/month → **≈ $3.54/month**.
- **Total ≈ $4.34/month at 600 MAU.**

Scaled to all 2000 users simultaneously active (a deliberately pessimistic upper bound — full account base, not just monthly-active) with the same per-student usage: **≈ $14.50/month.** Padding usage assumptions 10x (much longer chats, heavier resubmission) still lands **under $150/month.**

**Bottom line: at these usage patterns, Groq's pricing makes the LLM the cheapest line item in the entire stack, not the bottleneck.** Hosting/infra (Part 6) will cost more than AI inference at this scale — don't over-optimize model choice before that's true. The one place cost discipline still matters: rate-limit `ai_mentor_asked` per student per hour (via the Redis layer in Part 3) so cost scales with genuine usage, not an accidental infinite loop or abuse.

---

## Part 6 — Recommended stack + hosting cost estimate (cheapest path that actually scales)

Sticking with what's already proven in this codebase (React/Vite, FastAPI, Postgres, Docker, Groq) rather than introducing new frameworks — the scaling work above is entirely additive infrastructure, not a rewrite.

| Component | Recommendation | Est. monthly cost @ 2000 users |
|---|---|---|
| Frontend static hosting | Cloudflare Pages (free tier easily covers this) | $0 |
| API (FastAPI, N replicas) | Render Standard or Railway, 1-3 replicas | $25-75 |
| Postgres | Render/Railway managed Postgres, small→medium tier | $20-50 |
| Redis | Upstash (serverless, pay-per-request) or Render Redis addon | $0-10 |
| Object storage (artifacts) | Cloudflare R2 (no egress fees — matters, since previews get fetched often) | $1-5 |
| Sandbox worker host (Part 2, Tier 1-2) | Dedicated Docker-capable VM (Hetzner/DigitalOcean) | $15-25 |
| Error tracking | Sentry free tier | $0 |
| AI (Groq) | Per Part 5 | $5-15 |
| **Total** | | **≈ $65-180/month** |

This is a deliberately conservative, un-optimized estimate (no annual-plan discounts, no reserved capacity). It's cheap enough that the right sequencing is: ship Part 2 Tier 1 + Part 4a (event log) first — they're the two changes with real user-facing impact — and treat Part 6's infra spend as something to turn on incrementally as Part 1's actual usage numbers come in, not something to pre-provision for a hypothetical peak.

---

## Part 7 — Phased rollout (what to build, in what order, and the trigger to move to the next phase)

1. **Now (0-50 students piloting):** current single-host setup is fine as-is. Only mandatory addition: Part 4a's activity event log — it's cheap to add now and expensive to backfill later (you can't retroactively log struggle signal you never captured).
2. **~50-300 concurrent submissions, or first time a submission queues visibly:** Part 2 Tier 1 (bounded worker pool + job table) + Part 3's PgBouncer + move artifacts to R2 (do this before there's more than one API replica, since local disk breaks the moment there is).
3. **~300+ concurrent, or queue wait time > 20s at peak, or genuinely 2000+ MAU:** Part 2 Tier 2 (dedicated worker service + Redis queue) + Part 3's full multi-replica API + Sentry/observability if not already in place.
4. **Real scale / multiple cohorts running simultaneously:** Part 2 Tier 3 (managed sandbox service or Kubernetes Jobs) + Part 4c's aggregate instructor dashboard becomes worth building (it's not useful until there's enough data to aggregate).

---

## Part 8 — Future upgrades (beyond 2000 users / beyond this scope)

- **Multi-language sandboxes** — today's `sandboxes/python` Dockerfile pattern generalizes directly: a `sandboxes/sql`, `sandboxes/r`, etc. image per language, same `run_submission()` interface.
- **Proactive AI nudges** — once Part 4a's event log exists, a scheduled job can flag `idle_timeout` or repeated `check_failed` patterns and have the AI Mentor proactively message the student ("noticed you're stuck on the discount_pct check — want a hint?") instead of waiting to be asked — this is a natural next step once the data model is in place, not a new architecture.
- **Instructor/mentor dashboard** — Part 4c's aggregate queries, surfaced as a real UI for teaching staff, once there's a cohort large enough to make class-wide patterns meaningful.
- **Adaptive difficulty / personalized hints** — using the event log to tailor which hint tier or dataset difficulty a struggling student sees next.
- **Embeddings-based semantic search** — only once a concrete feature needs it (Part 4b), e.g. searching Task 5 briefs by theme across a cohort.
- **Kubernetes migration** — only justified once Part 2 Tier 3's managed-service costs exceed the ops overhead of running it yourself; don't adopt it earlier "for scale" it doesn't need yet.

---

## Sources for pricing figures

- [Groq On-Demand Pricing](https://groq.com/pricing)
- [Groq API Pricing (June 2026) — AI Pricing Guru](https://www.aipricing.guru/groq-pricing/)
- [Groq Pricing In 2026 — CloudZero](https://www.cloudzero.com/blog/groq-pricing/)
- [Render vs Railway vs Fly.io: 2026 Pricing Showdown](https://expresstech.io/render-vs-railway-vs-fly-io-2026-pricing-showdown/)
