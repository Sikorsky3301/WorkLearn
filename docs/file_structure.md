# File Structure Reference

A file-by-file map of the WorkLearn monorepo: what each file is for and how
it works. For the folder-level summary (the shape without the detail), see
the root [`README.md`](../README.md)'s "Repo layout" section — this doc goes
one level deeper, into individual files.

Related docs: [`flow diagram.md`](flow%20diagram.md) (frontend user flow),
[`flow_diagram_backend.md`](flow_diagram_backend.md) (backend API flow),
[`TEST_LOGINS.md`](TEST_LOGINS.md) (demo accounts + tenant hosts).

Organized backend-first, then frontend, in the same directory order the
code is actually laid out in.

---

## `backend/`

### Top-level files

- **`main.py`** — not here; see `app/main.py` below.
- **`requirements.txt`** — production Python dependencies (FastAPI, SQLAlchemy+asyncpg, pydantic-settings, python-jose, passlib[bcrypt], litellm, langfuse, docker SDK, kubernetes SDK, etc.).
- **`requirements-dev.txt`** — adds pytest, pytest-asyncio, httpx (for ASGI-transport integration tests) on top of `requirements.txt`.
- **`pytest.ini`** — `asyncio_mode = auto` plus `asyncio_default_fixture_loop_scope = session`. The session-scoped loop matters because the DB engine is created once per test session; without this, pytest-asyncio defaults test *functions* (not just fixtures) to function-scoped loops, causing asyncpg connections to end up bound to a closed loop from a previous test.
- **`.env.example`** — template for `.env` (never committed): `DATABASE_URL`, JWT secret, one AI provider's key (`AI_PROVIDER` selects which), LiteLLM Proxy settings, Langfuse keys, sandbox runner config.
- **`.dockerignore`** — excludes `wvenv/`, `__pycache__/`, `.env`, test artifacts from the Docker build context.
- **`Dockerfile`** — `python:3.11-slim`, installs `requirements.txt`, copies `app/` + `seed.py`, runs `uvicorn app.main:app` on port 3001. Used by the local Docker-Desktop-K8s deployment (`k8s/backend/`), not by `docker-compose.yml` (which only runs Postgres + LiteLLM Proxy for local dev).
- **`seed.py`** — demo-account seeder (`python seed.py`): ensures tables exist, re-runs `seed_roles_and_universities`, then upserts demo users (password for every account: `password`). Documented in [`docs/TEST_LOGINS.md`](TEST_LOGINS.md): academy student `demo@worklearn.ai`, Super Admin `admin@worklearn.ai`, platform Admin `platform@worklearn.ai`, IITD students/teacher (and a seeded `university_admin` that has **no working frontend admin gate**). Existing demo rows are updated (password + role/profile), not skipped.
- **`schema_recreate.sql`** — optional SQL reference for a clean Postgres schema rebuild (roles/universities ids align with `ROLE_IDS` / `roles_seed`).
- **`check_ai_provider.py`** — manual (non-pytest) smoke test: prints the configured `AI_PROVIDER` and whether a key is present, then calls `app.ai.services.llm.generate()` with a trivial prompt and prints the real response — the fastest way to confirm an AI key actually works before starting the full server.
- **`migrate_legacy_sims.py`** — one-time, idempotent migration that transcribes the 3 originally-hardcoded job simulations (da-job-sim, frontend-dev-sim, sales-crm-sim — previously defined as Python/JS dicts scattered across route files and frontend config) into real `Simulation`/`SimulationTask` rows in the new CMS schema. Already run; kept for history/reference, `_insert_sim` no-ops if a simulation id already exists.
- **`resync_legacy_sims.py`** — companion to the above: since real enrollments now reference those simulation ids (so rows can't be dropped and re-inserted), this re-runs the same builder functions as an UPDATE against the existing rows whenever `migrate_legacy_sims.py`'s builders are edited after the fact.
- **`structure_backend.txt`** — a raw `tree /F`-style directory dump generated once during this session for reference while planning the `routes/v1` → `api/v1/<domain>` restructure; not consumed by any code.
- **`ARCHITECTURE.md`** — scaling plan/notes for handling 2000+ concurrent users (see the file itself for specifics — connection pooling, sandbox concurrency, etc.).

### `app/core/`

Cross-cutting concerns — config, auth primitives, permission checks, logging, request tracing. Nothing here is domain/business logic.

- **`config.py`** — the single `Settings` (pydantic-settings) object every other module reads configuration from, plus a handful of genuinely-global product constants that don't belong to any one simulation: `TARGET_ROLE_REQUIREMENTS` (per-target-role skill thresholds used by Skill GPS), `SKILL_LABELS` (skill-key → display name), `QUIZ_BONUS_THRESHOLD`/`QUIZ_BONUS_XP`, `INACTIVITY_DAYS`. `_ENV_FILE` is resolved from `Path(__file__)`, not CWD, so `.env` loads correctly regardless of which directory `uvicorn` is launched from. `ai_provider` selects among `anthropic | gemini | groq | openai | litellm_proxy`.
- **`auth.py`** — password hashing (`hash_password`/`verify_password`, bcrypt via passlib) and JWT helpers: `create_token(user_id, role, expire_hours=None)` embeds `sub` (string user id) / `role` (RoleSlug) / `exp` only — no `sa` flag and no permissions array; `decode_token()`, `get_current_user`, and `token_user_id()`. Admin/superadmin logins pass a shorter `expire_hours` from settings.
- **`permissions.py`** — role-slug access control. `require_roles(*allowed_slugs)` checks the JWT `role`, loads the live `User`, enforces `is_active`, and rejects if the DB role no longer matches the token. `require_permission(key)` is a **back-compat alias** that ignores `key` and allows `super_admin` | `admin` | `university_admin` — fine-grained AdminRole/Permission tables were removed.
- **`logging_config.py`** — `configure_logging(level)`, called once at the top of `app/main.py` before anything else imports, wires up a single console handler with a `[request_id]`-tagged format string. `disable_existing_loggers: False` is deliberate — otherwise uvicorn's own access/error loggers would go silent.
- **`request_context.py`** — `RequestIdMiddleware` assigns (or reuses an incoming `X-Request-ID` header for) a per-request correlation id, stored in a `ContextVar` so deep helpers with no `Request` object (like `llm.py`) can still have their logs tagged with it; `RequestIdLogFilter` is what actually injects it into every log record. The id is deliberately never reset in a `finally`, since the global exception handler needs to still see it after an unhandled exception propagates.
- **`paths.py`** — canonical, single-source-of-truth filesystem paths (`BACKEND_ROOT`, `STATIC_DIR`, `UPLOAD_DIR`, `PHOTO_DIR`, `RESUME_DIR`), all derived once from `Path(__file__).resolve().parents[2]`. Added after a real bug where each route file independently hardcoded a `.parent.parent[.parent]` chain that silently broke (pointed at the wrong directory) the moment a route file moved one level deeper in the `routes/` → `routes/v1/` → `api/v1/<domain>/` restructures.

### `app/db/`

- **`database.py`** — the async SQLAlchemy engine (`create_async_engine`, `echo` tied to `LOG_LEVEL == DEBUG`), `AsyncSessionLocal` sessionmaker, the shared `Base` declarative class every model inherits from, and the `get_db()` FastAPI dependency (yields a session per request, closes it after).

### `app/models/`

A package rather than one flat file — `__init__.py` holds core tables; feature modules are registered onto `Base.metadata` via `# noqa: F401` imports in `app/main.py` so `create_all` sees them.

- **`helpers.py`** — shared `utcnow()` (and related helpers) imported by model modules.
- **`roles.py`** — platform persona roles as a real `roles` table + `RoleSlug` constants (`super_admin`, `admin`, `university_admin`, `teacher`, `student`) and stable `ROLE_IDS`. Access is by slug in code — there is no role_permissions join table.
- **`university.py`** — multi-tenant org: `University` with unique `code` (e.g. `DEFAULT`, `IITD`), `name`, `is_default`. Subdomain `iitd` resolves to `code=IITD` (see `services/tenant.py`). `DEFAULT_UNIVERSITY_CODE = "DEFAULT"` for the Teaching Academy.
- **`__init__.py`** — core schema: `EnrollmentStatus`/`MessageType` enums; `User` (email/roll_no, `role_id` FK → `roles`, `university_id` FK → `universities`, profile/onboarding/XP fields; `.role` property returns the slug string for JWT/frontend); `Enrollment`, `TaskCompletion`, `UserSkill`, `XpLedger`, `AgentMessage`, `UnlockedFeature`, `UserBadge`, `MentorChatMessage`. Super Admin is a normal `User` with `role_id` for `super_admin` — there is no separate `SuperAdminCredential` table.
- **`rbac.py`** — `AuditLog` only (append-only admin-action trail). `AdminRole` / `Permission` / `AdminRolePermission` tables were removed; portal access is by `RoleSlug` via `require_roles` / `require_permission`.
- **`cms.py`** — the Simulation CMS schema: `Simulation` (id is the same opaque string `Enrollment.simulation_id` already stored — admin-typed, immutable slug; carries title/company/logo/domain/manager persona/onboarding content/rating/`section_labels` for week-grouped display) and `SimulationTask` (one row per task — `task_index` is the same int `TaskCompletion.task_id` stores; carries briefing/what-to-do/hints/success-criteria/reference-data/model-solution/rubric/`config` — a type-specific JSON payload validated by `app/services/task_types.py` — plus `xp_award`/`skill_awards`). Also defines the fixed `TASK_TYPES` tuple (`text_rubric`, `structured_form`, `quiz`, `ai_roleplay_chat`, `crm_workspace`, `code_sandbox`).
- **`sim_builder.py`** — a second, independent simulation-authoring schema for the drag-drop visual "Sim Builder" (Weeks → Pages → Blocks), deliberately separate from `cms.py`'s single-`type`-per-task model since a Sim Builder page is a free-form stack of blocks of different types: `SimBuilderProject`, `SimBuilderPage` (ordered, optionally grouped by `week`), `SimBuilderBlock` (one of `services/block_types.py`'s block types, type-specific `config` JSON), `SimBuilderVersion` (a full serialized snapshot taken on publish — powers both Publish and Version History via whole-snapshot restore, not field-level diffing). v1 is authoring-only; published content isn't yet rendered to students.
- **`feature_flags.py`** — `FeatureFlag` (catalog row with an `enabled_default` fallback) and `FeatureFlagOverride` (layers on top at increasing specificity — role < university < user, resolved by `services/feature_flags.py`). Replaces a previously-hardcoded `ROLE_FEATURES` map that lived in the frontend's `AuthContext`.
- **`platform_config.py`** — `PlatformConfig`, a generic `(category, key) → value` store backing the SuperAdmin Configuration Center (AI provider, billing provider, database settings). Explicitly a config *surface* only — values are persisted but not yet read back into live app behavior (e.g. `llm.py` still reads `.env`, not this table).
- **`profile.py`** — `EducationEntry`, a user's education history (a user can have many, unlike the flat contact/photo/resume fields that live directly on `User`).
- **`certificate.py`** — `Certificate`, the terminal, once-per-(user, simulation) credential issued automatically on full task completion (see `services/certificates.py`). Unique on `(user_id, simulation_id)`. Fields are denormalized at issue time on purpose — a certificate is a historical record that shouldn't silently change if the simulation is later renamed.

### `app/schemas/`

Pydantic request/response shapes, one file per feature area, mirroring `models/`'s split (no `schemas/__init__.py` core file — the original core routes use inline/simple shapes rather than a shared schema module).

- **`cms.py`** — the largest schema file: per-task-type config shapes (`QuizConfig`, `TextRubricConfig`, `StructuredFormConfig`, `AiRoleplayChatConfig`, `CrmWorkspaceConfig`, `CodeSandboxConfig`, plus their sub-shapes like `QuizQuestion`/`FormField`/`RoleplayPersona`/`DeclarativeRule`), `ManagerPersona`/`OnboardingCompany`/`OnboardingOffer`/`OnboardingContent`, and the CRUD bodies (`SimulationCreate`/`Update`, `SimulationTaskCreate`/`Update`, `ReorderTasksBody`, `DuplicateSimulationBody`, `CreateFromTemplateBody`) plus `validate_task_config()` — dispatches to the right per-type Pydantic model based on `type` before a task is saved.
- **`rbac.py`** — request/response shapes still used by admin-management (e.g. `AdminCreate`/`AdminOut`, `AuditLogOut`). Permission/AdminRole CRUD schemas may remain for list-only/stub endpoints after the table removal.
- **`sim_builder.py`** — one config shape per Sim Builder block type (`HeadingConfig`, `TextConfig`, `ImageConfig`, `QuizBlockConfig`, `VideoConfig`, `AiChatConfig`, `EmailExerciseConfig`, `CodingChallengeConfig`, `FileUploadConfig`, `AssessmentConfig` + `AssessmentCriterion`, `BranchingLogicConfig` + `BranchingLogicBranch`, `TimerConfig`, `XpRewardsConfig`), plus CRUD bodies for projects/pages/blocks and `AiGenerateBody` (AI-assisted block generation).
- **`feature_flags.py`** — `FeatureFlagOverrideOut`, `FeatureFlagCreate`/`Update`/`Out`, `SetOverrideBody`.
- **`profile.py`** — `ProfileUpdateBody`, `EducationIn`/`Out` (`EducationOut.id` should match the ORM `int` primary key).
- **`platform_config.py`** — `ConfigEntryOut`, `SetConfigBody`.

### `app/utils/`

Empty (`__init__.py` only) — reserved for generic, domain-agnostic helpers that don't yet exist. Deliberately not populated preemptively.

### `app/api/v1/` — versioned routes, grouped by RBAC domain

Every route file's own internal `APIRouter(prefix=...)` is unchanged from before the restructure — only the file's *location* and `app/main.py`'s import lines changed. See the root README's backend layout for why each file landed in its domain.

#### `app/api/v1/auth/`

- **`auth.py`** — every login/register flow, all tenant-aware via `X-WorkLearn-Host` / request Host → `resolve_tenant`:
  - `POST /api/auth/register` — academy-only self-signup as `student` on the default university
  - `POST /api/auth/login/direct` — academy student (must be `student`, **no** `roll_no`)
  - `POST /api/auth/login/superadmin` — `super_admin` user (same `users` table)
  - `POST /api/auth/login/admin` — on default tenant: platform `admin`; on partner subdomain: `university_admin` for that university
  - `POST /api/auth/login/university` — partner-only; `student` **with** `roll_no`, scoped to tenant
  - `POST /api/auth/login/mentor` — partner-only; `teacher`, scoped to tenant
  - `GET /api/auth/me` — session refresh (education, feature flags, unlocked features, badges)
  `_safe_user()` serializes a `User` for the client (never leaks `password_hash`). Partner vs academy is enforced with `_require_partner` / `_require_academy`.

#### `app/api/v1/tenant.py`

- Public `GET /api/tenant` — resolves the current university from host / `X-WorkLearn-Host` and returns `{id, code, name, is_default, subdomain}`. No auth. Frontend `TenantContext` is written to call this, but see frontend notes — the provider is not currently mounted in `AppProviders`, and `client.js` does not yet send `X-WorkLearn-Host`.

#### `app/api/v1/users/`

- **`profile.py`** — the logged-in user's own self-service profile: `PUT /profile` (contact/bio fields), `POST /complete-onboarding`, photo/resume upload+delete (`POST`/`DELETE /photo`, `/resume` — validates extension/size, writes to `PHOTO_DIR`/`RESUME_DIR` from `core/paths.py`, best-effort deletes the old file), and full CRUD on `EducationEntry` rows. Every route acts only on `token["sub"]`'s own row — there is no "edit someone else" path here (that's `admin_management.py`).
- **`certificates.py`** — read-only: `GET /api/users/me/certificates` (the caller's own list) and the unauthenticated `GET /api/certificates/{certificate_number}` public verification lookup (returns only certificate-face data — no user id/email — since the whole point is a recruiter outside the platform can check it). Deliberately no POST — issuance is automatic (see `services/certificates.py`), never student-initiated.

#### `app/api/v1/simulations/`

- **`enrollments.py`** — the biggest and most central route file: enroll-in-a-simulation, onboarding accept/offer-letter flow, `complete_task` (awards XP/skills via `skill_engine.award_task_completion`, then calls `services/simulation_completion.finalize_if_complete`), assignment-building helpers (`_build_assignment`, `_get_sim_tasks` — also imported by the AI Mentor's tool-calling code so it can describe a student's current task in chat), and `JOURNEY_BADGE_KEY` (the "accepted the offer" milestone badge, imported by `admin.py`/`admin_simulations.py` for the bulk de-enroll endpoint's badge cleanup).
- **`sandbox.py`** — code-sandbox task submission: `POST /api/sandbox/submit` runs student code through the configured runner (Docker or Kubernetes, see `services/sandbox.py`), grades it via `services/graders/registry.py`, persists a graded artifact (skipped on a `dry_run` "Run" preview), awards XP via `skill_engine.award_task_completion`, and — since sandbox-graded tasks are real task completions — calls the same `finalize_if_complete()` `enrollments.py` uses, so a simulation made entirely of `code_sandbox` tasks still gets marked complete and issues its certificate.
- **`agent_messages.py`** — the manager-persona message inbox/feed for a simulation (standup/reminder/review/nudge messages generated by `app/agents/manager.py`'s scheduler and by task-completion flows) — list + mark-read.

#### `app/api/v1/builder/`

- **`admin_sim_builder.py`** — the full backend for the drag-drop Sim Builder: project CRUD, page CRUD (with reordering), block CRUD (with reordering, one endpoint per the ~13 block types' validated `config` shape), publish (snapshots the whole tree into a `SimBuilderVersion`), version history list + restore, and an AI-assisted "generate this block's content" endpoint backed by `llm.py`.

#### `app/api/v1/admin/`

- **`admin.py`** — Admin-portal stats/universities/users/activity: `GET /stats`, `/universities` (counts students/teachers per `University` row), `GET /users` (excludes platform `admin`/`super_admin`), `GET /activity`, unlock/suspend/activate/delete user, enrollment admin helpers.
- **`provisioning.py`** — `POST /api/admin/provision/users` — create student/teacher/university_admin accounts into a university (gated to super_admin/admin/university_admin; uni-admins can only provision into their own org).
- **`admin_simulations.py`** — CRUD for the (non-Sim-Builder) Simulation CMS: create/duplicate/publish/unpublish a `Simulation`, task CRUD + reordering, "create from template" (via `cms_templates/`), and `DELETE /{sim_id}/enrollments` — the bulk de-enroll-all-students endpoint (removes every `Enrollment` + `UserBadge` row for that simulation, audit-logged).
- **`admin_simulation_templates.py`** — small: lists the available starter templates from `app/cms_templates/` for the "create from template" picker.
- **`admin_uploads.py`** — generic image upload for CMS content (simulation logos, manager photos) — same validated-extension/size pattern as `profile.py`'s photo upload, writing into the shared `UPLOAD_DIR`.

#### `app/api/v1/superadmin/`

- **`admin_management.py`** — SuperAdmin-only lifecycle of platform `admin` users (list/create/patch/suspend/activate/reset-password/delete) and `GET /audit-log`. Role/permission catalog endpoints list built-in `roles` table rows (or empty stubs) — custom AdminRole/Permission CRUD was removed; access is by role slug via `require_permission` (alias for admin-tier roles).
- **`feature_flags.py`** — CRUD on `FeatureFlag` catalog rows plus `FeatureFlagOverride` set/delete (role/university/user-scoped), backing the Feature Flags manager.
- **`platform_analytics.py`** — platform-wide/cohort analytics (distinct from `analytics.py`'s per-user analytics).
- **`platform_config.py`** — `GET`/`PUT` on `PlatformConfig` rows by `(category, key)` — Configuration Center (AI provider, billing, database settings display).

#### `app/api/v1/analytics/`

- **`analytics.py`** — a student's own analytics (skill trends, task history, XP over time) — `GET /api/analytics`. Distinct from `superadmin/platform_analytics.py`'s platform-wide view.

#### `app/api/v1/mentor/`

- **`mentor.py`** — Teacher (`teacher`) endpoints: list students in their university/section, grant/revoke per-student feature unlocks. Super Admin may also pass the mentor role check.

### `app/routes/`

- **`health.py`** — `GET /health`, deliberately unversioned (sits alongside `api/v1/`, not inside it, and outside the `/api` prefix every v1 router uses) so orchestrators/monitoring (see `k8s/backend/deployment.yaml`'s liveness/readiness probes) don't need to know about API versioning just to check the process is up.

### `app/services/`

Business logic, kept out of route files so it's independently testable and reusable across route/AI-tool call sites.

- **`permissions_seed.py`** — stub documenting that AdminRole/Permission seeding was removed; roles + universities are seeded by `roles_seed.py` instead.
- **`roles_seed.py`** — idempotent upsert of the five `Role` rows and default universities (`DEFAULT` Teaching Academy + partner `IITD`). Called from `main.py` lifespan and from `seed.py`.
- **`tenant.py`** — multi-tenant host resolution: `extract_partner_subdomain`, `host_from_request` (prefers `X-WorkLearn-Host`), `resolve_tenant` / `get_tenant`, `tenant_public_dict`. Maps `iitd.localhost` → university `code=IITD`; bare `localhost` → default academy.
- **`simulation_lookup.py`** — `get_simulation(db, key)` resolves a simulation by integer id or public `slug`.
- **`certificates.py`** — `build_certificate_number()` (format `WL-<SIM5>-<YEAR>-<RAND6>`, random tail so it can't leak issuance volume or be guessed), `issue_certificate_if_complete()` (idempotent — returns an existing certificate if present, checks `total_tasks == completed_count`, catches an `IntegrityError` on a lost race and refetches), and `certificate_dict()` (the API-facing serializer).
- **`simulation_completion.py`** — `finalize_if_complete()`, the single place that decides "is this simulation finished?" and reacts: marks the `Enrollment` `COMPLETED`, posts the manager persona's congratulatory `AgentMessage`, and calls `certificates.py`'s issuance — all idempotent, safe to call after every single task completion regardless of which route (`enrollments.py` or `sandbox.py`) triggered it. Added specifically because `code_sandbox`-only simulations (da-job-sim, frontend-dev-sim) were never reaching completion when this logic lived only in `enrollments.py`.
- **`audit.py`** — `resolve_actor_info()` / `log_action()` for `AuditLog` rows (piggybacks on the caller's commit; tags request-id).
- **`artifacts.py`** — local-disk artifact store for chained sandbox tasks (Task 1's cleaned CSV becomes Task 2's input dataset): `save_artifact()`/`load_artifact()`, keyed by `enrollment_id` so each student's artifacts flow independently. No DB table — just files under `data/artifacts/<enrollment_id>/`.
- **`block_types.py`** — `BLOCK_TYPES` registry for the Sim Builder's 13 block types (heading, text, image, video, quiz, ai_chat, coding_challenge, email_exercise, file_upload, timer, xp_rewards, assessment, branching_logic) — human label, palette category, and default `config` for a newly-inserted block. The 7 added after the original 6 are editor-preview only (no live grading wired up yet).
- **`dataset.py`** — `generate_dataset()`, the canonical, seeded-random "lumen_orders" dataset generator for the Data Analyst job simulation. The seed derives from `enrollment_id`, so each student's dataset is distinct but reproducible — the same function is called both to hand the student their `dataset.csv` and to compute the backend's ground-truth reference solution, so the two can never disagree, and copy-pasted answers between students don't work.
- **`feature_flags.py`** — `FEATURE_FLAG_CATALOG` + `ROLE_DEFAULTS`, `seed_feature_flags()`, and `resolve_feature_flags()` (precedence: `enabled_default` < role override < university override < user override — called on every login/`/me` response). University overrides match `universities.code`.
- **`frontend_specs.py`** — `FRONTEND_TEST_SPECS`, the hidden Jest `submission.test.js` source per task for the Frontend Developer job simulation — the sandbox writes this alongside the student's own submission file before running Jest. This is that simulation's equivalent of `dataset.py`'s computed reference solution for the DA sim.
- **`platform_config.py`** — `CONFIG_CATALOG` (every `PlatformConfig` row the Configuration Center can show/edit, grouped `ai`/`billing`/`database`, seeded from the app's real current `.env` values where one exists so the form isn't blank), `seed_platform_config()` (insert-if-missing, never clobbers an admin's saved value), `catalog_meta()`.
- **`sandbox.py`** — the facade route files call instead of talking to a runner directly: `run_submission()` (dispatches to whichever runner `SANDBOX_RUNNER` configures — Docker or Kubernetes, see `sandbox_runners/`), `read_output()`, `cleanup()`.
- **`sim_view.py`** — `build_simulation_public_dict()`/`build_task_public_dict()`, the shared "full simulation" response shape used by both the public student runtime and the admin draft-preview endpoint, factored out specifically so those two trust boundaries (published-only vs. any-status, and secret-config-stripped vs. not) can't silently drift apart.
- **`skill_engine.py`** — `award_task_completion()`: upserts the `TaskCompletion` row, applies `SimulationTask.skill_awards` to the user's `UserSkill` rows (capped at 100), computes total XP (base `xp_award` + a `QUIZ_BONUS_XP` bonus if `quiz_score >= QUIZ_BONUS_THRESHOLD`), writes an `XpLedger` entry, bumps `User.xp`, and advances `Enrollment.current_task_idx`. Also `get_user_skills()` and `compute_skill_gps()` (gap analysis against `TARGET_ROLE_REQUIREMENTS` for the Skill GPS page — current vs. required per skill, overall readiness %, top 3 gaps).
- **`task_types.py`** — `TASK_TYPES` registry for the CMS's 6 fixed task types (text_rubric, structured_form, quiz, ai_roleplay_chat, crm_workspace, code_sandbox) — which grading mechanism each uses, whether it needs a sandbox, and which `config` keys must be stripped (`strip_secrets()`) before a task is ever sent to a student (e.g. an LLM judge prompt or a quiz's correct answers).

### `app/services/graders/`

Per-task-type grading logic — invoked by `sandbox.py`'s route after a submission runs.

- **`registry.py`** — dispatch table mapping `(simulation_id, task_index)` (or a grader key) to the right grading function below.
- **`declarative_rules.py`** — a small rules DSL for the Frontend Developer sim's structural checks (e.g. "does this CSS use flexbox/grid", "does this element have an aria-expanded attribute") — evaluates a list of `DeclarativeRule` objects against submitted markup/JS without needing a full LLM call for purely mechanical checks.
- **`task1_cleaning.py`** / **`task2_report.py`** / **`task3_segmentation.py`** / **`task4_ab_test.py`** / **`task5_brief.py`** — the Data Analyst job simulation's 5 task graders, each comparing the student's submitted output against the ground-truth computed from `dataset.py`'s same-seed reference solution (e.g. task1 checks a cleaned CSV's dedup/null-handling, task4 checks an A/B test's statistical conclusion).
- **`frontend_common.py`** — shared helpers for the 5 frontend-sim graders below (e.g. reading the student's HTML/CSS/JS submission files, invoking the sandboxed Jest run via `frontend_specs.py`'s hidden specs).
- **`frontend_task1.py`** through **`frontend_task5.py`** — the Frontend Developer job simulation's 5 task graders (landing hero markup, responsive nav, accessibility, async data fetching, a small React-like component task), each pairing a Jest spec from `frontend_specs.py` with any additional declarative/structural checks.

### `app/services/sandbox_runners/`

Two interchangeable backends for actually executing student code, selected by `SANDBOX_RUNNER` in `.env`.

- **`base.py`** — `SandboxResult` (the shared return shape — `workdir`, stdout/stderr, exit code, timed-out flag) and `get_runner()`, which returns whichever runner class below is configured.
- **`docker_runner.py`** — local dev: `docker run`s the configured image (`SANDBOX_IMAGE`/`SANDBOX_IMAGE_FRONTEND`) with resource limits (memory/CPU/timeout from `Settings`), mounting the student's code and any `input_files`.
- **`k8s_runner.py`** — in-cluster: launches the submission as a Kubernetes `Job` in the `worklearn-sandbox` namespace instead of a local Docker container, for the k8s deployment path (see `k8s/README.md`).

### `app/ai/`

Everything that exists *because of* AI, split from `app/services/`/`app/api/v1/` so the "LLM-dependent" surface area is easy to find in one place.

- **`services/llm.py`** — the unified AI client, powered by `litellm` (one call shape across Anthropic/Groq/Gemini/any OpenAI-Chat-Completions-compatible endpoint, replacing ~280 lines of duplicated per-provider code). `_model_for()`/`_provider_kwargs()` select the model string and credentials for whichever `AI_PROVIDER` is configured (including the 5th value, `litellm_proxy`, which routes through a separately-run LiteLLM Proxy gateway via the same `openai/` passthrough prefix). Three public functions every caller uses: `generate()` (one-shot, non-streaming — grading, brief-judging), `stream_chat()` (async-generator streaming for AI Mentor/CRM-sim/roleplay chat), `chat_with_tools()` (resolves any tool calls the model wants to make, via the hand-written `_resolve_tool_calls()` agentic loop, before the caller's own streaming call). Every call is wrapped in `langfuse_client.traced_observation()` — deliberately this app's own tracing, not litellm's built-in Langfuse callback, to avoid two independent tracing paths writing to the same project.
- **`services/langfuse_client.py`** — Langfuse tracing setup, fully guarded by `langfuse_enabled` (true only once both API keys are configured) so tracing is zero-overhead/zero-log-noise when unset. `init_langfuse()`/`shutdown_langfuse()` (called from `main.py`'s lifespan), `traced_observation()` (context manager wrapping a span or generation, no-ops via `_NoopObservation` when disabled), `traced_context()` (tags the active trace with user/session/tags), `get_current_trace_id()` (captured at message-save time so a later thumbs-up/down can score the trace after it's closed), `score_trace()`.
- **`services/mentor_personas.py`** — `build_system_prompt()`/`get_persona()`: maps each known `Simulation.domain` string to its own AI Mentor persona (purpose/scope/refusal text, quick-topic chips), built from one shared template — replaces an earlier version that hardcoded a single "data analyst" persona regardless of what simulation the student was actually in. Falls back to `DEFAULT_PERSONA` for unmapped domains or no active enrollment.
- **`services/mentor_tools.py`** — the AI Mentor's function-calling surface: `TOOL_SCHEMAS` (4 tools — `get_current_task`, `get_skill_gaps`, `get_task_history`, `get_xp_ledger`), each a thin wrapper around existing query logic (`_build_assignment`, `compute_skill_gps`, direct `TaskCompletion`/`XpLedger` queries) via `MentorToolContext`. `execute_tool()` is the single dispatch point and never raises — malformed args, unknown tool names, and tool failures all degrade to a logged `{"error": ...}` result instead of crashing the chat turn.
- **`routes/ai_mentor.py`** — the AI Mentor chat endpoints: `POST /api/chat` (builds the domain-scoped system prompt + an always-on "current task" context block, resolves tool calls via `chat_with_tools`, then streams the real reply as SSE, persisting both the user and assistant `MentorChatMessage` rows), `GET`/`DELETE /api/chat/history`, `PATCH /api/chat/history/{id}/feedback` (thumbs up/down, also scores the Langfuse trace if configured), `GET /api/mentor/topics` (domain-aware quick-topic chips), `GET /api/skill-gps` (skill-gap analysis plus an LLM-generated "3 next actions" list, with a non-LLM fallback if generation/parsing fails).
- **`routes/sim_runtime.py`** — generic student-facing runtime endpoints for CMS-authored simulations not already covered by `enrollments.py`: `GET /api/simulations/{sim_id}/full` (PUBLISHED-only, grading secrets stripped — the *only* access control this endpoint has, so it's deliberately kept separate from the admin draft-preview endpoint rather than growing a bypass flag). `ai_roleplay_chat`/`text_rubric` LLM grading are independent implementations here (call `generate()`/`stream_chat()` directly) rather than routed through any CRM-sim-specific code, so other simulations can reuse this runtime without a hidden dependency.

### `app/agents/`

- **`manager.py`** — the "Manager" persona's **deterministic, non-AI** scheduler (`AsyncIOScheduler` via APScheduler) — despite the folder name, this is not an LLM agent framework. Three cron jobs started from `main.py`'s lifespan: `_daily_reminder` (08:00 UTC, nudges students with pending tasks), `_deadline_check` (every 6 hours, flags simulations past their 14-day expected completion), `_inactivity_nudge` (10:00 UTC, nudges students inactive for `INACTIVITY_DAYS`). All three post fixed-template `AgentMessage` rows, no LLM call involved.

### `app/cms_templates/`

One starter-template module per domain for the Simulation CMS's "create from template" flow, each exporting a `TEMPLATE` dict shaped `{key, label, description, simulation, tasks}` (`simulation` matches `SimulationCreate` minus `id`, each `tasks` entry matches `SimulationTaskCreate`) — instantiated into a real `DRAFT` `Simulation` by `admin_simulations.py`'s `create_from_template`.

- **`customer_support.py`** — Customer Support Associate at "Orbit Support" (ticket triage, upset-customer de-escalation, resolution logging).
- **`finance_accounting.py`** — a Finance/Accounting starter template (reconciliation, reporting-style tasks).
- **`healthcare_admin.py`** — a Healthcare Administration starter template (patient scheduling/records-style tasks).
- **`hr_recruiting.py`** — an HR/Recruiting starter template (candidate screening/pipeline-style tasks).
- **`it_engineering.py`** — an IT/Engineering starter template (ticket/incident-style tasks).
- **`marketing_content.py`** — a Marketing/Content starter template (campaign/copywriting-style tasks).
- **`product_management.py`** — a Product Management starter template (spec-writing/prioritization-style tasks).

### `app/main.py`

The FastAPI app object and its wiring — the one file that ties every package above together:
- **`lifespan()`** — on startup: `create_all` (dev-convenience schema sync), then `seed_roles_and_universities`, `seed_feature_flags`, `seed_platform_config`, starts the Manager APScheduler (`agents/manager.py`), and initializes Langfuse tracing. On shutdown: stops the scheduler, flushes Langfuse.
- **Middleware**: CORS — `_cors_origins()` allows both `localhost` and `127.0.0.1` forms of `FRONTEND_URL`, plus `allow_origin_regex` for partner subdomains (`http://iitd.localhost:5173` etc.); `RequestIdMiddleware` (added after CORS so it runs outermost).
- **`unhandled_exception_handler`** — global catch-all for anything that isn't an intentional `HTTPException`, returns a generic 500 + request-id, logs the real traceback server-side only.
- The full `import` + `include_router()` list for every route module across `api/v1/*` (including `tenant` + `provisioning`), `ai/routes/*`, and `routes/health`, plus the `# noqa: F401` model-registration imports needed for `create_all` to see every table (roles, university, cms, sim_builder, rbac/audit, feature_flags, platform_config, profile, certificate).
- Mounts `/static` to serve `STATIC_DIR` (uploaded photos/resumes/CMS images).

### `migrations/`

Numbered, idempotent one-off scripts for schema changes `Base.metadata.create_all` can't express (altering a table that already has data) — this project's committed alternative to Alembic.

- **`run.py`** — the runner (`python -m migrations.run`): ensures brand-new tables exist via `create_all`, creates a `schema_migrations` tracking table, then applies every `NNNN_*.py` file in order whose `MIGRATION_ID` isn't already recorded as applied.
- **`0001_users_is_active_suspended.py`** — adds `users.is_active`/`suspended_at` (real suspend/activate, replacing hard-delete-only).
- **`0002_users_role_enum_add_admin.py`** — adds the `ADMIN` value to the Postgres `role` enum type (run in autocommit mode — Postgres can't `ALTER TYPE ... ADD VALUE` inside a transaction block).
- **`0003_users_admin_role_fk.py`** — adds `users.admin_role_id` (FK to the new `admin_roles` table).
- **`0004_users_profile_fields.py`** — adds the Portfolio self-service fields (`headline`, `bio`, `phone`, `location`, social links, `photo_url`, resume fields) to `users`.
- **`0005_users_onboarding.py`** — adds `users.onboarding_completed`/`preferred_domain`, then backfills every pre-existing account to `onboarding_completed = true` so the first-login wizard only ever fires for genuinely new sign-ups.
- **`0006_certificates.py`** — backfills a `Certificate` row for every already-`COMPLETED` enrollment that didn't already have one.
- **`0007_finalize_stuck_enrollments.py`** — repairs enrollments that finished every task but were never marked `COMPLETED` (the bug `services/simulation_completion.py` fixes going forward) — flips their status and mints the missing certificate.

### `tests/`

pytest suite, split `unit/`/`integration/` — a real but intentionally-scoped suite (auth, RBAC enforcement, grading logic, a few pure utils), not full route/component coverage. See `tests/README.md` for the full rationale.

- **`conftest.py`** — session-scoped fixtures run against a **real** Postgres database (a dedicated `<db>_test` database, created fresh and dropped after the session — not SQLite/mocks, since the app relies on Postgres-native enums/JSON columns). `DATABASE_URL` is overridden at module scope *before* any `app.*` import (the async engine is built at import time). `_clean_tables` truncates every table after each test for isolation, then re-seeds permissions. `client`/`db_session` fixtures give tests an httpx `AsyncClient` (via ASGI transport, no real network) and a raw DB session respectively.
- **`unit/test_auth.py`** — pure-logic: password hash roundtrip, JWT create/decode carrying `sub` + `role` (no permissions claim on the token).
- **`unit/test_declarative_rules.py`** — pure-logic tests for the no-code grading DSL (`services/graders/declarative_rules.py`) against synthetic submitted JSON — no DB, no HTTP.
- **`integration/test_auth_routes.py`** — real HTTP (in-process ASGI transport) tests of the academy student register/login/`/me` flow against the real test database. Sets `pytestmark = pytest.mark.asyncio(loop_scope="session")` at module level — required because pytest-asyncio's auto-mode stamps a function-scoped loop marker before any collection hook could fix it up, and the session-scoped DB engine needs every test on that same loop.
- **`integration/test_rbac.py`** — role-gate coverage for `require_roles` / `require_permission` (admin-tier alias) against live DB users — access is by role slug, not a JWT permissions array.
- **`README.md`** — documents what this suite does and deliberately does not cover, and the Postgres/`CREATEDB` privilege prerequisite for running it.

### `sandboxes/`

Docker images for the two code-execution sandboxes — built once on the host, then run per-submission by `services/sandbox_runners/`.

- **`README.md`** — one-time host setup (`docker build` commands for both images) and verification commands.
- **`python/Dockerfile`** — `python:3.12-slim`, pins `pandas`/`numpy`/`matplotlib`/`scipy`/`statsmodels`, non-root `sandboxuser`, no network tools/compilers/shell utilities beyond what those libraries need at import time.
- **`python/entrypoint.py`** — the container's PID 1: runs the student's `/workspace/submission.py` (headless matplotlib backend, since there's no display), captures stdout/stderr via normal process streams (read back by the host's `docker run` subprocess, not captured in-container), and treats whatever the student's code writes to `/workspace/output.*` as the only trusted grading input — printed text is never trusted.
- **`frontend/Dockerfile`** — `node:20-slim`, installs Jest + deps from `frontend/package.json`, non-root `sandboxuser`.
- **`frontend/entrypoint.js`** — the container's PID 1: runs the hidden `/workspace/submission.test.js` (a Jest spec written server-side from `services/frontend_specs.py`, never sent to the student) against the student's submission file, writes the report to `/workspace/output.json`. A failing test is a valid gradable result; only a *missing* report (bad Jest config, unparsable file) counts as a harness failure.
- **`frontend/package.json`** / **`babel.config.js`** / **`jest.config.js`** / **`jest.setup.js`** — the frontend sandbox's pinned Jest/Babel toolchain, baked into the image at build time (not installed per-submission, for speed and to keep the sandbox network-isolated at run time).

### `litellm-proxy/`

Optional standalone AI gateway config — an alternative to (not a replacement for) the in-process `litellm` SDK usage in `app/ai/services/llm.py`. Off by default; switching to it is a single `.env` change (`AI_PROVIDER=litellm_proxy`).

- **`README.md`** — how to run it locally (`docker compose up litellm-proxy litellm-proxy-db`, its own dedicated Postgres so virtual keys/spend logs never mix with WorkLearn's business data), how to generate a virtual key, and the `.env` vars that point the backend at it.
- **`config.yaml`** — `model_list`: every model the proxy exposes under a stable `model_name` (`claude-sonnet`, `llama-groq`, `gemini-flash`, plus `local-qwen` for a self-hosted model tunneled via ngrok) — swapping which real provider/model backs a given name only ever means editing this file. `general_settings.store_model_in_db: true` lets routing be managed from the proxy's own `/ui` too. Its own Langfuse callback is deliberately left disabled (`litellm_settings` has no `success_callback`) — the backend already traces every call itself; enabling both would double-trace into the same Langfuse project.

---

## `frontend/`

### `src/main.jsx`

Entry point. `ReactDOM.createRoot(...).render(<AppProviders><AppRouter /></AppProviders>)` — the whole app is just those two composed components, plus the one `styles/index.css` import. Kept deliberately tiny; all the actual provider nesting and route table live in `app/providers/` and `app/router/`.

### `src/app/providers/`

- **`AppProviders.jsx`** — the app-wide provider stack: `React.StrictMode` → class-based `ErrorBoundary` → `BrowserRouter` → `QueryClientProvider` (TanStack Query, `retry: 1`, `refetchOnWindowFocus: false`) → `AuthProvider` → `{children}` (`AppRouter`) → shadcn `Toaster`. Note: `TenantProvider` exists under `features/auth/TenantContext.jsx` but is **not** currently wrapped here.

### `src/app/router/`

- **`AppRouter.jsx`** — the entire route table:
  - **Marketing (public):** `/` (landing, wrapped in `PublicOnlyRoute`), `/about`, `/institutions`, `/contact`, `/blog` — use `MarketingNav`/`MarketingFooter`, not `MainLayout`.
  - **Auth:** `/login` (academy student), `/university/login` (partner student), `/mentor/login` (partner teacher). Admin / Super Admin logins are shown by their guards when unauthenticated on `/admin` and `/super-admin`. Partner UI has **no** university-admin login page.
  - **`/super-admin/*`** — `RequireSuperAdmin` + lazy `SuperAdminPortal`.
  - **`/admin/*`** — `RequireAdmin` + lazy `AdminPortal`; sibling full-screen CMS/Sim Builder routes under `/admin/simulations/:id`, `/admin/sim-builder`.
  - **Authenticated app** — behind `ProtectedRoute`; `/mentor` and `/onboarding` are full-screen; everything else under `MainLayout` (Navbar + Outlet + Footer, footer hidden on focused sim/MIRA session via `FOOTERLESS_*`). MIRA routes nest under `MiraLayout` (`MiraProvider`).

#### `src/app/router/guards/`

- **`ProtectedRoute.jsx`** — must be logged in; redirects to `/login` if not; bounces `super_admin` → `/super-admin` and `admin` → `/admin`; redirects `student` with `onboarding_completed: false` to `/onboarding`.
- **`RequireAdmin.jsx`** — gates `/admin*`; if not `admin` or `super_admin`, renders `AdminPortalLogin` inline. Does **not** allow `university_admin`.
- **`RequireSuperAdmin.jsx`** — gates `/super-admin*`; if not `super_admin`, renders `SuperAdminLogin` inline (does not bounce an Admin session to `/admin`).
- **`PublicOnlyRoute.jsx`** — wraps marketing `/`: signed-in users go to `/dashboard` so they don't land on the sales page.
- **`PortalSpinner.jsx`** — full-screen spinner while auth resolves or a lazy portal chunk downloads.

### `src/app/store/`

Zustand stores — client-side, mostly-persisted state for the two simulation runtimes that need richer local state than a React Query cache alone provides.

- **`useGenericSimStore.js`** — per-simulation-slug store (one instance per `slug`, via a factory + cache) backing `GenericSimShell`: `status` (`in_progress`/`completed`), `enrollmentId`, `currentTaskIndex`, `completedTasks`, `elapsedSeconds` (ticked every second while in progress), actions `startSimulation`/`goToTask`/`completeTask`/`tick`. Persisted to `localStorage` per slug so a page refresh resumes where the student left off — this persistence is also the source of the "stale enrollment id" bug class documented in `GenericSimShell.jsx` (a persisted id can point at a since-deleted enrollment).
- **`useGenericSimStore.test.js`** — exercises the store's state-machine logic directly via `store.getState()`, no React rendering needed.
- **`useCrmSimStore.js`** — the sales-crm-sim (Nimbus CRM)'s own richer store: CRM entity state (leads/accounts/contacts/opportunities/activities/tasks), stage progression, and manager-chat state, using `createEvent`/`STAGES`/`SEED_LEAD`/`getManagerReply` from the sim's own `engine`/`data` modules.

### `src/rbac/`

Role/permission constants for the frontend.

- **`roles.js`** — `ROLES` matching backend `RoleSlug`: `student`, `teacher`, `university_admin`, `admin`, `super_admin`. Old names `DIRECT_USER` / `UNIVERSITY_STUDENT` / `CLASS_MENTOR` are gone — independent vs university-affiliated students share `student` and are distinguished by `user.university.is_default`.
- **`permissions.js`** — named permission-key constants (historical catalog keys). Backend `require_permission` no longer checks per-key grants; UI `hasPermission` treats any admin-tier role as allowed.
- **`usePermission.js`** — thin wrapper over `AuthContext.hasPermission()`.

### `src/hooks/`

React Query hooks, one file per domain — every hook wraps a single backend endpoint (query or mutation), with `queryKey` naming and `onSuccess` invalidations chosen to keep the cache consistent across features that share data (e.g. completing a task invalidates `skills`, `certificates`, and `badges`, not just `enrollment`).

- **`index.js`** — barrel re-export (`export * from './X'` for every domain file below) — this used to be one 639-line file; splitting it kept every existing `from '.../hooks'` import site working without knowing which domain file a hook actually lives in.
- **`simulations.js`** — the core simulation-browsing/enrollment flow: `useSimulations` (the full catalog), `useEnrollment`/`useEnroll`, `useMyAssignment`/`useMyAssignments` (current task per enrollment, what the Dashboard renders), `useOnboarding`/`useAcceptOnboarding` (offer-letter flow), `useSimulationFull` (a CMS-authored simulation's full runtime definition).
- **`sandbox.js`** — `useSubmitSandbox` (code-sandbox task submission), `useSandboxFiles` (Explorer sidebar directory listing), `useSandboxFileRows` (paginated CSV row viewer for large datasets like `dataset.csv`'s ~9,600 rows).
- **`tasks.js`** — `useCompleteTask`, the generic (non-sandbox) task-completion mutation. Sends `quiz_score`/`rubric_rating` in snake_case deliberately — a camelCase payload was silently dropped by the backend's Pydantic schema, meaning quiz scores were never persisted and the quiz-bonus XP could never fire. Invalidates `certificates`/`badges` too, since finishing the final task can issue a certificate/grant a badge server-side.
- **`skills.js`** — `useSkillGPS` (gap analysis for a target role), `useUserSkills` (raw per-skill scores).
- **`messages.js`** — the Manager's `AgentMessage` inbox: `useAgentMessages` (polls every 30s), `useMarkMessageRead`, `useMarkAllRead`.
- **`badges.js`** — `useUserBadges` (milestone badges, e.g. accepting an offer letter).
- **`certificates.js`** — `useUserCertificates`, read-only (certificates are issued server-side on completion, never created client-side).
- **`analytics.js`** — `useAnalytics`, a student's own per-period analytics — distinct from `platform-analytics.js`'s platform-wide view.
- **`mentor.js`** — Teacher roster (`useMentorStudents`, `useUnlockFeature`/`useRevokeFeature`) and the AI Mentor's domain-aware quick-topic chips (`useMentorTopics`). Message send/stream/feedback itself is NOT here — that's a plain `fetch`-based SSE reader in `ai-mentor/useMentorChat.js`.
- **`roleplay.js`** — `useRoleplayMessage`/`useGradeText`, the generic CMS-authored `ai_roleplay_chat`/`text_rubric` (LLM mode) task types.
- **`profile.js`** — self-service Portfolio profile mutations (`useUpdateProfile`, photo/resume upload+delete via `uploadFile`, education CRUD, `useCompleteOnboarding`). No query hook for the profile itself — `user` (and its `education` array) comes from `AuthContext`'s own `/api/auth/me`, so every mutation here just needs to trigger `refreshUser()` afterwards rather than maintaining a separate cache.
- **`admin.js`** — Admin-portal user/university/activity management (`useAdminStats`, `useAdminUniversities`, `useAdminUsers`, `useAdminActivity`, `useUserEnrollments`, suspend/activate/delete-user, `useDeleteEnrollment`). Despite the historical name, works for any `ADMIN` holding the matching permission, not superadmin-exclusive — every underlying endpoint is `require_permission`-gated server-side.
- **`admin-simulations.js`** — the Simulation CMS's full CRUD surface: simulation create/update/publish/unpublish/delete/duplicate, "create from template", task CRUD + reorder, `useUnenrollAllStudents` (the bulk de-enroll used to clear the "simulation has existing enrollments" delete-block), plus admin-only preview endpoints (`usePreviewFullSimulation`, `usePreviewRunSandbox`).
- **`admin-sim-builder.js`** — the separate drag-drop Sim Builder's CRUD (projects/pages/blocks, each with reorder mutations), publish + version history (`useSimBuilderVersions`/`useRestoreSimBuilderVersion`), and `useAiGenerateSimBuilder` (AI-assisted block content generation).
- **`admin-management.js`** — SuperAdmin's admin-account lifecycle (`useAdmins`, create/update/suspend/activate/delete, `useResetAdminPassword`), `AdminRole` CRUD, `usePermissionCatalog`, and `useAdminAuditLog` (filterable by action/actor role/target type/search/date range).
- **`feature-flags.js`** — CRUD on `FeatureFlag` catalog rows plus per-scope overrides (`useFlagOverrides`/`useSetFlagOverride`/`useDeleteFlagOverride`) — the flags resolved *for the current user* come back on login/`/me` instead (`user.feature_flags`), this file is the admin-facing management surface only.
- **`platform-analytics.js`** — `usePlatformAnalytics`, platform-wide/cohort analytics — distinct from `analytics.js`'s per-user view.
- **`platform-config.js`** — `usePlatformConfig`/`useSetPlatformConfig` for the SuperAdmin Configuration Center's `(category, key) → value` rows.

### `src/lib/`

Cross-cutting, non-React helpers — the fetch client and small pure utility modules every feature draws from.

- **`client.js`** — the whole app's HTTP layer: `api.{get,post,put,patch,del}` (JSON fetch wrapper, bearer token from `sessionStorage` — per-tab isolation), `setToken`/`clearToken`, 401 handler that only force-redirects when a token was attached, `uploadImage`/`uploadFile`, `resolveMediaUrl`, `downloadFile`, `streamChat` (AI Mentor SSE). **Does not currently send `X-WorkLearn-Host`** — partner subdomain multi-tenant resolution against `localhost:3001` needs that header (see `services/tenant.py` / `TEST_LOGINS.md`).
- **`cn.js`** — `cn(...inputs)`, the standard `clsx` + `tailwind-merge` className combinator used throughout every component.
- **`cn.test.js`** — unit tests for `cn()`'s merge/override behavior.
- **`domainIcons.js`** — `resolveDomainIcon(label)`, substring-rule-based (not exact-match, since `Simulation.domain`/`.category` are free text) icon lookup for the domain filter bar/cards, with a generic fallback so a brand-new CMS-authored domain never renders with a missing icon.
- **`domainMeta.js`** — `domainDescription(domain)`, the same substring-rule pattern as `domainIcons.js`, for the onboarding wizard's domain-selection step blurbs.
- **`simBranding.js`** — `SIM_BRANDING`, a client-side-only lookup (logo, accent color, manager photo, card banner image) keyed by simulation id — purely cosmetic, the backend has no notion of any of this. `banner` images are real licensed Unsplash stock photos matched to each simulation's actual work domain, not fabricated/AI-generated. Shared by the Dashboard and Portfolio (case studies) so branding is defined once.
- **`pdf/index.js`** — the lazy-loading boundary: `downloadBadgePdf`/`downloadCertificatePdf` each `await import('./credentialPdf')` on first call rather than being static exports, keeping jsPDF's ~400KB out of the main bundle (it's only ever needed after a user clicks Download).
- **`pdf/document.js`** — shared PDF layout primitives (the "house style" every generated document uses): `createDocument()` (landscape A4 with the brand top/bottom band + inner hairline frame, returns `frameTop`/`frameBottom`/`contentWidth` so callers lay out against the real frame instead of raw page edges — a real bug once had the footer print outside the frame border from a raw-page-edge calculation), `drawFittedTitle` (auto-shrinks text to fit), `drawMetaRow` (auto-shrinks values that would collide with neighboring columns), `drawCrest`, `drawEyebrow`/`drawSubtitle`/`drawRecipient`/`drawWordmark`/`drawFooterNote`, `formatDate`, `slugify`. Drawn with jsPDF vector primitives (not DOM-to-canvas rasterization) so the output stays sharp at any zoom and the file stays ~10KB.
- **`pdf/credentialPdf.js`** — `downloadBadgePdf`/`downloadCertificatePdf`, the two document layouts (title/crest/recipient/meta-row/footnote), differing only in wording and which meta fields they carry. Every printed field comes from a real `UserBadge`/`Certificate` record plus the signed-in user — nothing invented at render time.

### `src/components/`

Renamed from `shared/` this session. Design-system + generic UI primitives, plus the app's global chrome (Navbar/Footer/NotFound).

- **`Footer.jsx`** — the global site footer, hidden on focused work sessions (see `AppRouter.jsx`'s `FOOTERLESS_ROUTES`).
- **`Navbar.jsx`** — the global top nav; the signed-in avatar checks `user.photo_url` first (via `resolveMediaUrl`), falling back to initials only when no photo is uploaded.
- **`NotFound.jsx`** — the catch-all 404 page for any unmatched route.

#### `components/design-system/`

Admin/SuperAdmin-portal-only components — their own dark-mode scope, never rendered in the student-facing app.

- **`PortalShell.jsx`** — the shared app-shell wrapper for both portals: mounts its own `ThemeProvider` and applies the resulting dark-mode class (`wl-portal-dark`) only to its own root div, never `<html>`/`<body>`, so dark mode can never leak into the student app even if a shared component were reused there.
- **`Sidebar.jsx`** — generic left nav, data-driven (`sections: [{ label?, items: [{ label, icon, to, end?, badge? }] }]`) — same component renders both the Admin and SuperAdmin portal's nav with different section data.
- **`Topbar.jsx`** — generic page header (title/description left, arbitrary actions right) for a `PortalShell` page.
- **`ThemeToggle.jsx`** — light/dark toggle button, reads/writes via `useTheme()`.
- **`theme/ThemeProvider.jsx`** / **`theme/useTheme.js`** — the portal-scoped theme context, persisted to `localStorage` under `wl_portal_theme`.
- **`DataTable.jsx`** — generic data table for portal list pages (`columns: [{key, header, render?}]`), with a built-in loading skeleton and `EmptyState` fallback.
- **`EmptyState.jsx`** — generic empty-list placeholder, reused both for genuinely empty lists and for honest "ships in Phase 2" placeholders (e.g. some Admin portal analytics pages) — the copy passed in is what distinguishes the two cases.
- **`StatCard.jsx`** — a labeled number tile with an optional icon and trend indicator (colored +/-% line).
- **`PermissionGate.jsx`** — UI-only conditional render gated on a permission key, now a thin wrapper over `rbac/usePermission.js` (moved here from `AuthContext`-coupled inline logic this session).

#### `components/ui/`

Shared primitives — hand-rolled utility components plus a handful of Aceternity UI components ported to plain JSX for the MIRA marketing sections.

- **`Avatar.jsx`** / **`Avatar.test.jsx`** — small avatar primitive (initials / image).
- **`IconField.jsx`** — a labeled-icon text input, shared by `EditProfileModal` and the onboarding wizard's contact step so both look identical.
- **`RatingStars.jsx`** — read-only 5-star display (supports half-stars), reused by the simulation overview page, picker card, and admin preview tab.
- **`RatingStars.test.jsx`** — component-rendering tests via Testing Library.
- **`file-upload.jsx`** — Aceternity's File Upload component, ported off `react-dropzone`/`@tabler/icons-react` onto native HTML5 drag-and-drop + an inline SVG icon, to avoid adding either dependency (this codebase hand-writes its SVG icons throughout).
- **`google-gemini-effect.jsx`** — Aceternity's animated gradient-title effect, restyled to WorkLearn's indigo/violet palette (originally pink/orange/blue) — used on a MIRA marketing section.
- **`infinite-moving-cards.jsx`** — Aceternity's marquee card scroller, content adapted to render a logo image rather than a testimonial quote.
- **`three-d-card.jsx`** — Aceternity's mouse-tilt 3D card effect.
- **`wobble-card.jsx`** — Aceternity's mouse-tilt "wobble" card, rebuilt on plain React state + CSS transitions instead of `framer-motion`, removing that dependency for this one component.

#### `components/ui/shadcn/`

Standard shadcn/ui-generated primitives (`badge`, `button`, `calendar`, `card`, `command`, `dialog`, `dropdown-menu`, `input`, `label`, `progress`, `select`, `sheet`, `table`, `tabs`, `textarea` — all thin, mostly-unmodified Radix-based wrappers with Tailwind class variants). One worth calling out specifically: **`sonner.jsx`** is the toast host (`<Toaster />`), mounted once by `app/providers/AppProviders.jsx` — every `toast.success()`/`toast.error()` call anywhere in the app renders through this single instance.

### `src/styles/index.css`

The only stylesheet in the app (moved here from `src/` root this session). Three Tailwind `@tailwind` directives, an `@layer base` block (base typography/colors, including a deliberate `html { font-size: 18px }` global zoom), and an `@layer components` block defining `.btn-primary`/`.btn-secondary` (rounded-lg, shadow, `active:scale-[0.98]`, baked-in flex layout so callers don't need to add utility classes manually) and `.input`.

### `src/types/README.md`

Placeholder — reserved for shared JSDoc typedefs if/when the codebase adopts them. Currently empty; the project is plain JavaScript with no TypeScript and no JSDoc type annotations anywhere yet.

### `src/test/`

- **`README.md`** — documents the test layout convention (tests live next to the code they cover, e.g. `Foo.jsx` → `Foo.test.jsx`, not a mirrored `__tests__` tree) and what is/isn't covered.
- **`setup.js`** — Vitest global setup, wires up `@testing-library/jest-dom`'s matchers (`toBeInTheDocument()` etc.).

### Root config files

- **`vite.config.js`** — `@vitejs/plugin-react`, `assetsInclude: ['**/*.lottie']`, dev server currently `host: '127.0.0.1'` with `strictPort: true` (partner hosts like `iitd.localhost` may need `host: true` — see `TEST_LOGINS.md`), and the `test` block (`environment: 'happy-dom'`, `globals: true`, `setupFiles: './src/test/setup.js'`). No path aliases — every import is relative.
- **`tailwind.config.js`** — content globs over `index.html` + `src/**/*.{js,jsx}`; `darkMode: ['selector', '.wl-portal-dark']` (a custom selector, not the default `.dark` on `<html>`, scoped only to the Admin/SuperAdmin `PortalShell` root so dark-mode utilities can never activate in the student-facing app); the brand color palette (`primary`/`secondary`/`surface`/`on-surface`/`outline`/`tertiary`), a flattened `borderRadius` scale, `max-w-container` (1280px), and the `scroll` keyframe/animation used by `infinite-moving-cards.jsx`'s marquee.
- **`package.json`** — key scripts: `dev` (Vite dev server), `build`, `preview`, `test`/`test:watch` (Vitest). Notable dependencies: `@tanstack/react-query` (server-state cache), `zustand` (client state), `react-router-dom` v6, `@dnd-kit/*` (Sim Builder drag-and-drop), `@monaco-editor/react` (code sandbox editor), `jspdf` (credential PDFs, lazy-loaded), `zod`/`react-hook-form`/`@hookform/resolvers` (form validation), `sonner` (toasts), `recharts`/`@tanstack/react-table` (admin analytics/tables), `motion` (a handful of Aceternity-derived components), Radix primitives + `class-variance-authority`/`cmdk` (shadcn's own dependencies). Dev-only: `vitest` + `@testing-library/*` + `happy-dom`, `tailwindcss` + `autoprefixer` + `postcss`.
- **`index.html`** — the single HTML shell: loads the Inter webfont from Google Fonts, mounts `#root`, and loads `/src/main.jsx` as a module script. No other script tags.

### `src/features/`

One folder per feature area's real implementation. `AppRouter.jsx` imports each feature's top-level component directly.

#### `features/auth/`

- **`AuthContext.jsx`** — session layer: restores token from `sessionStorage` on mount (5s timeout), exposes `register` / `loginDirect` / `loginSuperAdmin` / `loginAdmin` / `loginUniversity` / `loginMentor` / `logout` / `refreshUser`, plus `hasFeature` (DB feature flags + unlocks) and `hasPermission` (true for `super_admin` | `admin` | `university_admin`; key ignored — matches backend `require_permission` alias).
- **`TenantContext.jsx`** — calls `GET /api/tenant`, exposes `{ tenant, isPartner }`. **Not mounted** in `AppProviders` today; for partner subdomains to work end-to-end, mount this provider and send `X-WorkLearn-Host: window.location.host` from `lib/client.js`.
- **`global/Login.jsx`** — academy student sign-in / sign-up only (`loginDirect` / `register`). Split-screen layout; Google SSO button is UI-only (not wired).
- **`global/AdminPortalLogin.jsx`** — platform admin login (`loginAdmin` → `/api/auth/login/admin`). Used when visiting `/admin` without an admin/super_admin session.
- **`global/SuperAdminLogin.jsx`** — super admin login (`loginSuperAdmin` → `/api/auth/login/superadmin`).
- **`university/UniversityLogin.jsx`** — partner **student** login UI only. **Client/server mismatch:** posts `{ roll_no, password }` while `auth.py` expects `{ email, password }` (student must still *have* a `roll_no` in the DB).
- **`university/MentorLogin.jsx`** — partner **teacher** login UI only. Posts `{ mentor_id, password }` while backend expects `{ email, password }`.

#### `features/marketing/`

Public marketing site (no `MainLayout` / app Navbar).

- **`LandingPage.jsx`** — `/` hero and sections (`HeroSection`, `HowItWorksSection`, `FeaturesBentoSection`, `AppShowcaseSection`, `SimulationsShowcase`, `TrustSection`, `PricingSection`, `FinalCtaSection`).
- **`AboutPage.jsx`**, **`InstitutionsPage.jsx`**, **`ContactPage.jsx`**, **`BlogPage.jsx`** — secondary marketing pages (`/about`, `/institutions`, `/contact`, `/blog`).
- **`useMarketingLinks.js`** — shared nav/CTA link helpers for marketing chrome.
- **`components/MarketingNav.jsx`**, **`MarketingFooter.jsx`**, **`MarketingPageShell.jsx`** — marketing chrome.
- **`components/screens/*`** — decorative in-browser “app window” mock screens used on the landing showcase (`DashboardScreen`, `SimulationScreen`, `MentorScreen`, `SkillGpsScreen`, `AnalyticsScreen`, `AppWindow`).
- **`data/pricingTiers.js`**, **`data/trustPlaceholders.js`** — static marketing content.
- **`sections/*`** — individual landing sections listed above.

#### `features/analytics/`

- **`Analytics.jsx`** — a student's own analytics dashboard: top stats, a week-by-week XP activity chart, a GitHub-style streak grid, and per-skill trend bars — all from `useAnalytics(period)`.

#### `features/community/`

- **`Community.jsx`** — a cohort/social feed: a leaderboard-style member roster and a discussion feed (interview experiences, Q&A threads with likes/replies). Currently backed by hardcoded sample data (`cohortMembers`, `discussions`) rather than a real backend endpoint — a Phase 2 feature surface.

#### `features/mentor/`

- **`ClassMentor.jsx`** — the Teacher portal: Overview / My Students / Assignments / Feature Access; roster via `useMentorStudents`; grant/revoke unlocks from `GRANTABLE_FEATURES`.

#### `features/skill-gps/`

- **`SkillGPS.jsx`** — skill-gap analysis against a selectable target role (`useSkillGPS`): overall readiness %, a filterable (met/gap/all) list of skills with current-vs-required bars, and AI-generated "next actions" for the biggest gaps.

#### `features/users/settings/`

- **`Settings.jsx`** — student-facing settings page (profile summary, pace/standup-time preferences, dark mode toggle, notification preferences). Currently local component state only (`useState`, hardcoded seed values) — not yet wired to a persisted backend settings endpoint.

#### `features/onboarding/`

The first-login wizard — gated in `ProtectedRoute` (any `student` with `onboarding_completed: false` is redirected here until they finish). Data is only persisted once, on the final step.

- **`OnboardingWizard.jsx`** — orchestrates the 6-step flow (`welcome → profile → contact → domain → education → review`), holding all step state locally until `handleFinish` fires the actual mutations (`useUpdateProfile`, `useUploadPhoto`, `useAddEducation`, `useCompleteOnboarding`) in sequence. Domain choices come from `useSimulations()`'s real published-simulation domains, never a hardcoded list.
- **`components/OnboardingLayout.jsx`** — the full-screen wizard shell (no Navbar/Footer) with a dot-strip step-progress indicator.
- **`steps/WelcomeStep.jsx`** — static intro copy.
- **`steps/ProfileStep.jsx`** — name/headline/bio fields + photo picker (with local preview before upload).
- **`steps/ContactStep.jsx`** — optional contact fields (phone/location/LinkedIn/GitHub/website) via the shared `IconField` component.
- **`steps/DomainStep.jsx`** — career-domain picker, options driven by real published simulation domains (via `resolveDomainIcon`/`domainDescription`), not a hardcoded list.
- **`steps/EducationStep.jsx`** — add/edit/remove education entries (institution/degree/field/years).
- **`steps/ReviewStep.jsx`** — final summary screen before submitting.

#### `features/dashboard/`

- **`Dashboard.jsx`** — the student home page: a personalized welcome banner (institution/department for university students), the `WelcomeVideoCard`, one `AssignmentCard` per active enrollment (`useMyAssignments`), and `JobSimulationsSection` for browsing/enrolling in more.
- **`components/AssignmentCard.jsx`** — one manager/task summary per enrolled simulation, so a student running several simulations at once sees every manager, not just the latest — branded per-sim via `SIM_BRANDING`.
- **`components/JobSimulationsSection.jsx`** — the full catalog, grouped by `Simulation.domain`; if the student picked a preferred domain during onboarding, that group renders first with a "Recommended" badge — everything else still shows, just ordered after.
- **`components/SimulationCard.jsx`** — one simulation row within a domain group — left accent rail (not a full banner) colored per `SIM_BRANDING`, optional `highlighted` ring for the student's preferred domain.
- **`components/WelcomeVideoCard.jsx`** — a compact explainer-video row; the `<video>` element (and its ~8MB source) only mounts once the student clicks Play, so loading the Dashboard never fetches it eagerly.

#### `features/ai-mentor/`

- **`CareerTwin.jsx`** — the AI Mentor's page shell: `ChatSidebar` + main chat panel, a "..." menu (clear chat with confirm), and the empty-state/message-list/input composition. Blocks `SUPER_ADMIN` entirely (`MentorAdminBlocked`) since admins have no student profile for the mentor to read.
- **`useMentorChat.js`** — owns all chat state/logic so `CareerTwin.jsx` stays presentational: `sendMessage` (optimistically appends the user message + a "live" assistant placeholder, streams via `lib/client.js`'s `streamChat`), `stopStreaming` (aborts via `AbortController`, keeps partial text without an error frame), `retry` (drops the failed pair and resends), `clearChat`, `submitFeedback` (optimistic thumbs up/down with rollback on failure).
- **`ChatSidebar.jsx`** — left nav (New Chat, nav items, collapsible to an icon rail), shows the student's top skill gaps (`useSkillGPS`) — items with no real backing feature are deliberately left out rather than faked.
- **`ChatInput.jsx`** — the input row plus domain-aware quick-prompt chips (from `GET /api/mentor/topics`), with a Stop button swapping in for Send while a reply streams.
- **`ChatMessage.jsx`** — one chat bubble; assistant text renders as real Markdown (`react-markdown`) rather than literal `**`/`###` characters. Shows copy/timestamp/thumbs-up-down on finished replies and a Retry action on the error state; shows `ThinkingIndicator` while waiting for the first streamed chunk.
- **`MentorAdminBlocked.jsx`** — the "not for admins" placeholder shown at `/ai-mentor` for `SUPER_ADMIN`.
- **`MentorWelcome.jsx`** — centered empty-conversation state with up to 3 real domain-aware topic cards.
- **`ThinkingIndicator.jsx`** — a looping Lottie sparkles animation shown inside the assistant bubble before the first chunk arrives.

#### `features/mira/`

MIRA — AI mock-interview product, its own self-contained layout (`MiraProvider`, mounted only for `/mira/*` routes in `AppRouter.jsx`).

- **`MiraContext.jsx`** — session state for an in-progress mock interview (selected type/difficulty/duration, current question, recorded answers, scoring results) shared across the setup/session/results pages.
- **`MiraHero.jsx`** — the MIRA landing/marketing page (`/mira`), composing the Aceternity-derived sections below plus a CTA into `MiraSetup`.
- **`MiraSetup.jsx`** — interview configuration screen (type/difficulty/duration pickers, sourced from `questionBank.js`).
- **`MiraSession.jsx`** — the live interview screen — speech capture via `useSpeechRecognition`, question progression, per-answer recording.
- **`MiraResults.jsx`** — post-interview scoring/feedback screen, computed via `scoring.js`.
- **`MiraGeminiSection.jsx`** — a marketing section built on `components/ui/google-gemini-effect.jsx`.
- **`MiraWobbleSection.jsx`** — a marketing section built on `components/ui/wobble-card.jsx`.
- **`MiraToolsMarquee.jsx`** — a marketing section built on `components/ui/infinite-moving-cards.jsx` (tool/tech logos).
- **`questionBank.js`** — `INTERVIEW_TYPES`, `DIFFICULTIES`, `DURATIONS`, and its own `ROLES` (interview job-role personas like "Product Manager" — unrelated to and not to be confused with `rbac/roles.js`'s auth roles) plus the actual question sets per type/difficulty.
- **`scoring.js`** — pure scoring logic that turns recorded answers into the `MiraResults` feedback shape.
- **`useSpeechRecognition.js`** — a hook wrapping the browser's Web Speech API for live transcription during a session.

#### `features/users/portfolio/`

The recruiter-facing Portfolio — Overview/Competencies/Certificates/Education/Projects tabs plus a persistent sidebar (Contact/Resume/Badges).

- **`Portfolio.jsx`** — the page shell and tab orchestration. Renders skills grouped by category (Technical/Cognitive/Leadership/Domain) with dot-colored category markers, earned badges (`BadgeTile`), completed simulations as "case studies" (`CaseStudyCard`), and earned certificates (`CertificateCard`) or an inline empty-state prompt. Avatar is click-to-upload (opens `EditProfileModal`) with a hover camera overlay.
- **`components/EditProfileModal.jsx`** — the profile-edit form (contact fields, bio, photo upload/delete, resume upload/delete) — the flow whose photo-upload path exercises the backend's `core/paths.py` fix end-to-end.
- **`components/EducationModal.jsx`** — add/edit one education entry.
- **`components/BadgeTile.jsx`** — renders a `CredentialShield` (crest word = the text after the em-dash in the badge label, e.g. "JOURNEY") plus a "PDF" download button (`downloadBadgePdf`).
- **`components/CaseStudyCard.jsx`** — one completed job simulation styled as a case study — real data only (title/company/accent/logo from `useSimulations`), no fabricated screenshot standing in for work that doesn't exist.
- **`components/CertificateCard.jsx`** — one earned certificate — shield, stats, the full (not truncated) copyable certificate number, and a Download button (`downloadCertificatePdf`).
- **`components/Modal.jsx`** — the shared centered-modal shell (backdrop click + Escape to close, body-scroll lock) used by `EditProfileModal`/`EducationModal`.
- **`components/credentials/CredentialShield.jsx`** — the pure-SVG crest/shield mark used by every earned credential (badges and certificates). Three tonal variants (solid/split/outline), picked deterministically by `variantFor(key)` from the credential's own key — so a given credential always renders identically rather than implying a rarity tier the platform doesn't have.

#### `features/admin/portal/`

The Admin portal — Simulations, Sim Builder, Feature Flags, Universities, and the Configuration Center all live here rather than in SuperAdmin's own portal (SUPER_ADMIN can still reach them via `RequireAdmin`, they're just not part of that portal's own nav).

- **`AdminPortal.jsx`** — the portal shell: `PortalShell` + `Sidebar` (nav items filtered by `hasPermission` — an Admin's nav only ever shows what their assigned `AdminRole` actually grants; `SUPER_ADMIN` sees every item) + a `Routes` switch over the 8 pages below.
- **`pages/OverviewPage.jsx`** — platform stats (`useAdminStats`), a mock total-billing tile (explicitly labeled — no payment provider integrated yet), a top-universities-by-students table, `ActivityFeed`, and a user-breakdown/platform-summary pair of small stat blocks.
- **`pages/UsersPage.jsx`** — thin wrapper: `<UsersTable title="Users" />`.
- **`pages/UniversitiesPage.jsx`** — `UniversitiesTable` plus a `UsersTable` filtered to teachers (`role="teacher"` / legacy filter strings may still appear in call sites — prefer `ROLES.TEACHER`).
- **`pages/SimulationsPage.jsx`** — thin wrapper around `features/builder/cms/SimulationsListPanel`.
- **`pages/AnalyticsPage.jsx`** — thin wrapper around `admin/shared/PlatformAnalytics`.
- **`pages/FeatureFlagsPage.jsx`** — thin wrapper around `admin/shared/FeatureFlagsManager`.
- **`pages/ActivityPage.jsx`** — thin wrapper around `admin/shared/ActivityFeed` (the XP-ledger feed — distinct from SuperAdmin's `AuditLogPage`, which is the admin-*action* audit trail).
- **`pages/ConfigurationPage.jsx`** — the Configuration Center's tab shell (AI Provider/Billing Provider/Database), each tab explicitly labeled with a "saved but not yet wired into live behavior" notice — honest about what's real vs. display-only.

#### `features/admin/shared/`

Components reused by both the Admin and SuperAdmin portals.

- **`UsersTable.jsx`** — generic user list+search, parameterized by `role` — reused for "Users", "Direct Users" (academy students), and teachers depending on caller. Prefer RoleSlug values (`student`, `teacher`); some pages may still pass legacy enum strings.
- **`UniversitiesTable.jsx`** — university list+search with student/teacher counts per `University` row.
- **`ManageUserModal.jsx`** — per-user management modal: view enrollments (with per-enrollment delete), suspend/activate, hard delete — shared by both portals' user tables.
- **`PlatformAnalytics.jsx`** — platform-wide stat tiles + `GrowthChart`.
- **`GrowthChart.jsx`** — a small hand-rolled (no charting library) single-series cumulative-user-growth SVG line chart, theme-aware via `useTheme`.
- **`FeatureFlagsManager.jsx`** — full `FeatureFlag` CRUD plus per-scope override management, gated internally by `PermissionGate`.
- **`ConfigSection.jsx`** — renders one Configuration Center category's editable key/value rows against real `PlatformConfig` data — secrets are write-only (the backend never returns an already-set secret's value, only whether one is stored).
- **`ActivityFeed.jsx`** — recent XP-ledger activity feed (`useAdminActivity`), with an `EmptyState` fallback.

#### `features/superadmin/`

Platform-level concerns — People, Admin Management, Activity/Audit logs. Simulations/Sim Builder/Feature Flags/Universities/Config Center live in the Admin portal instead (Super Admin can still open `/admin` via `RequireAdmin`).

- **`SuperAdminPortal.jsx`** — the portal shell, same `PortalShell`/`Sidebar`/`Topbar` pattern as `AdminPortal.jsx`.
- **`pages/OverviewPage.jsx`** — platform stats, mock billing tile, top-universities table, `ActivityFeed`.
- **`pages/AnalyticsPage.jsx`** — thin wrapper around `admin/shared/PlatformAnalytics`.
- **`pages/DirectUsersPage.jsx`** — academy / direct students table (call site may still pass legacy `DIRECT_USER`; backend role is `student` on the default university).
- **`pages/StudentsPage.jsx`** — university-student stats grouped by institution.
- **`pages/AdminManagementPage.jsx`** — platform Admin user lifecycle (create/suspend/activate/reset password/delete).
- **`pages/RolesPermissionsPage.jsx`** — lists built-in platform roles from the `roles` table; custom AdminRole editing was removed with those tables.
- **`pages/ActivityLogPage.jsx`** — thin wrapper around `admin/shared/ActivityFeed`.
- **`pages/AuditLogPage.jsx`** — searchable admin-action audit trail (`AuditLog`).

#### `features/builder/cms/`

The Simulation CMS — the structured, form-driven builder for `Simulation`/`SimulationTask` (distinct from the separate visual `sim-builder/` canvas tool below). Standalone full-screen page at `/admin/simulations/:id`, not nested in either portal's sidebar chrome.

- **`SimulationBuilder.jsx`** — the page shell: toolbar (back-to-admin, title/id, publish/unpublish) + a 4-tab `Tabs` layout (Metadata/Onboarding/Stages/Preview), the latter three disabled until the simulation has been created (has a real id).
- **`SimulationsListPanel.jsx`** — the Admin portal's Simulations list: search, publish/unpublish/duplicate/delete, `useUnenrollAllStudents` for clearing the "has existing enrollments" delete-block, and the entry point into `NewSimulationDialog`.
- **`NewSimulationDialog.jsx`** — "New Simulation" flow: pick blank-vs-template from `useSimulationTemplates()`, then (for a template) name the new simulation before `useCreateSimulationFromTemplate` instantiates it.
- **`shared/LogoUploadField.jsx`** — shared upload widget for the CMS's two image fields (`Simulation.logo_url`, manager `photo_url`) — file upload with live preview, plus a plain URL input fallback for an already-hosted image link.
- **`shared/ResizeHandle.jsx`** — a thin draggable divider between two resizable columns, paired with `useResizableWidth`.
- **`shared/taskTypeMeta.js`** — icon + accent-color classes per task type (`text_rubric`/`structured_form`/`quiz`/`ai_roleplay_chat`/`crm_workspace`/`code_sandbox`) for the visual Stages builder's type badges/borders. Classes are written out literally (not template-interpolated) so Tailwind's JIT class scanner can actually see them.
- **`shared/textListUtils.js`** — `linesToList()`, splits a textarea's newline-separated lines into a trimmed, non-empty array — used by several type-editors for list-shaped config fields.
- **`shared/useResizableWidth.js`** — vanilla mousedown/mousemove/mouseup drag-to-resize hook (adapted from the height-resize pattern in the DA sim's Jupyter playground), with a `reverse` option for a handle on a column's left edge.
- **`stages/StageCard.jsx`** — one task row in the Stages List view: drag handle (sortable reorder via `@dnd-kit`), a droppable insertion point for palette-drag-to-insert, a type-accent border + icon badge, and a Duplicate/Delete overflow menu.
- **`stages/StageFlowOverview.jsx`** — an alternate, toggleable "roadmap" view of the whole simulation as a connected horizontal flow — Onboarding/Completion end-caps, one lane per week, reusing the exact same drag primitives as the List view.
- **`stages/StageListView.jsx`** — the default List view: week-grouped, collapsible sections of `StageCard`s inside one `SortableContext`; drag/drop logic itself lives in the parent `StagesTab`.
- **`stages/StagePalette.jsx`** — the draggable task-type palette sidebar, grouped into Content/Interactive sections, with a genre-steering hint for `crm_workspace` (only makes sense for sales-style simulations).
- **`stages/TaskEditorWithPreview.jsx`** — the editor+live-preview split shown once a task is selected: owns `draft` (in-progress edits) and `savedTask` (last-persisted copy) so both halves of the split view stay in sync without extra plumbing in the parent.
- **`stages/TaskLivePreviewPane.jsx`** — mounts the REAL student-facing task component (structured_form/crm_workspace) directly against the live unsaved draft for `quiz`/`structured_form`/`crm_workspace`, or a preview-only wrapper for types where the real component has no way to dismiss/reset (e.g. quiz).
- **`stages/WeekPillStrip.jsx`** — the week/task navigator strip above the Stages canvas — one pill per distinct `week` value (plus "Ungrouped"), clicking expands and scrolls to that section.
- **`stages/editor/TaskEditorPanel.jsx`** — the unified per-task editor: common fields (title/objective/briefing/hints/success-criteria/xp/skills/rubric) plus a type-specific config section dispatched to one of the `type-editors/` components below.
- **`stages/editor/fields/FieldListEditor.jsx`** — generic editable list of `{key, label, type, required}` form-field rows, shared by `structured_form` and `text_rubric`.
- **`stages/editor/fields/ModelSolutionEditor.jsx`** — optional worked-example editor (steps/key-principle/great-looks-like/example-solution) — available to any task type.
- **`stages/editor/fields/ReferenceDataEditor.jsx`** — optional read-only "case file" content editor (title + label/value fields) — available to any task type.
- **`stages/editor/fields/RubricEditor.jsx`** — shared weighted-category rubric editor (category → weight, must sum to 1.0) — available to any task type.
- **`stages/editor/type-editors/CodeSandboxEditor.jsx`** — `code_sandbox` config: language, grading strategy, starter code, filenames, declarative rules.
- **`stages/editor/type-editors/CrmWorkspaceEditor.jsx`** — `crm_workspace` config: required CRM entities (key:count pairs) and pipeline stage names.
- **`stages/editor/type-editors/PersonaEditor.jsx`** — `ai_roleplay_chat` config: the AI persona's name/role/personality prompt/mood options.
- **`stages/editor/type-editors/QuizEditor.jsx`** — `quiz` config: question list with multiple-choice options and the correct-answer index.
- **`stages/editor/type-editors/StructuredFormFieldsEditor.jsx`** — thin wrapper delegating straight to `FieldListEditor`.
- **`stages/editor/type-editors/TextRubricEditor.jsx`** — `text_rubric` config: manual-vs-LLM grading mode toggle plus the shared `FieldListEditor` for any structured input fields.
- **`tabs/MetadataTab.jsx`** — the simulation's top-level metadata form (title/description/company/domain/category/accent color/difficulty/hours/skills), plus the logo upload.
- **`tabs/ManagerOnboardingTab.jsx`** — the manager persona + onboarding content (company info, intro copy, offer letter) editor, using a `patch()` helper for deep-path updates into the nested draft object.
- **`tabs/StagesTab.jsx`** — the drag-and-drop stage builder: two independent `@dnd-kit` interactions in one `DndContext` (palette-drag-to-insert a new task, and reorder existing tasks), composing `StagePalette` + `StageListView`/`StageFlowOverview` (toggleable) + `TaskEditorWithPreview`.
- **`tabs/PreviewTab.jsx`** — read-only content review before publishing: every stage's content rendered exactly as the generic runtime will show it, plus a full interactive run-through (`InteractiveSimPreview`) with no enrollment/grading side effects.

#### `features/builder/sim-builder/`

"Sim Builder" — a separate, Framer-like visual editor authoring simulations as Weeks → Pages → Blocks (`SimBuilderProject`/`Page`/`Block`, see backend `models/sim_builder.py`), deliberately independent of the CMS above. v1 is authoring-only — published content isn't yet rendered to real students.

- **`SimBuilderListPage.jsx`** — the landing page: project list + create/delete, parallel to the CMS's `SimulationsListPanel` but its own standalone route/header.
- **`SimBuilderEditor.jsx`** — the top-level 4-zone editor (toolbar / left sidebar / canvas / properties panel). Structural edits (add/delete/reorder a page or block) persist immediately and push an inverse action onto an in-memory (session-only) undo stack; block *config* edits are a local draft until Save, mirroring the CMS's `TaskEditorPanel` draft/save split.
- **`Canvas.jsx`** — the block-stack editing surface for the active page — a vertical drag-to-reorder list (not a freeform x/y canvas), rendering the selected block's live draft config in place of its saved one for WYSIWYG feedback.
- **`LeftSidebar.jsx`** — Weeks → Pages tree navigator, plus Assets/Templates tabs stubbed "Coming soon" in v1.
- **`PropertiesPanel.jsx`** — dispatches to the selected block's config editor by type — the same dispatch pattern as the CMS's `TaskEditorPanel`, entirely separate registry.
- **`Toolbar.jsx`** — back-to-projects, undo/redo, Preview/Version-History/AI-Generate triggers, Save, Publish.
- **`PreviewOverlay.jsx`** — a full-screen, read-only walkthrough of the whole tree using each block's static Preview renderer — admin-only, no persistence side effects.
- **`VersionHistoryPanel.jsx`** — lists snapshots created by Publish, with a confirm-before-restore step (destructive — replaces the live draft). Whole-snapshot based, not a field-level diff.
- **`AiGenerateDialog.jsx`** — "AI Generate" scoped to structural-skeleton generation (Weeks → Pages → Blocks with minimal on-topic config), not full content authoring — reuses the backend's `llm.py`, always appends rather than overwriting existing pages.
- **`SimBuilderLogo.jsx`** — Sim Builder's own inline-SVG mark, distinct from the WorkLearn logo used elsewhere in the admin surfaces.
- **`blockTypeRegistry.js`** — `blockTypeRegistry`/`BLOCK_GROUPS`/`DEFAULT_BLOCK_CONFIG`, mapping each of the 13 block types to its `{meta, Editor, Preview}` module below — entirely separate from the CMS's `taskTypeRegistry`/`taskTypeMeta`.
- **`blocks/*.jsx`** (13 files: `HeadingBlock`, `TextBlock`, `ImageBlock`, `VideoBlock`, `QuizBlock`, `AiChatBlock`, `EmailExerciseBlock`, `CodingChallengeBlock`, `FileUploadBlock`, `AssessmentBlock`, `BranchingLogicBlock`, `TimerBlock`, `XpRewardsBlock`) — each exports `{meta: {label, icon}, Editor, Preview}`: `Editor` is the properties-panel form for that block's config, `Preview` is its static WYSIWYG render on the canvas/preview overlay. The original 6 (`heading`/`text`/`image`/`video`/`quiz` plus the block-stack mechanics) are straightforward config editors; the 7 added afterward (`ai_chat`, `coding_challenge`, `email_exercise`, `file_upload`, `timer`, `xp_rewards`, `assessment`, `branching_logic`) are editor-preview only for v1 — no live grading/runtime wired up, so their `Preview` shows what the block will look like rather than an interactive/gradable version of it (e.g. `AiChatBlock`'s preview shows a static opener, not a real LLM conversation).

#### `features/simulations/`

The student-facing simulation experience — browsing, enrolling, running, and completing job simulations. Three simulations exist today: `da-job-sim` and `frontend-dev-sim` (both fully generic/CMS-driven), and `sales-crm-sim` (still its own bespoke implementation, described separately below).

- **`SimulationWorkspace.jsx`** — the `/simulations` picker page: status tabs (All/Active/Completed with live counts), `DomainFilterBar`, course-marketplace-style cards (banner via `SIM_BRANDING`, floating difficulty badge, enrollment status pill). Also renders `COMING_SOON_SIMULATIONS` — non-interactive placeholder cards for roles from the original spec that aren't built yet, so the catalog page doesn't understate the intended scope.
- **`DomainFilterBar.jsx`** — domain filter chips computed from whatever distinct `domain` values actually exist across published simulations, not a hardcoded list — hides itself if there's nothing meaningful to filter (≤1 real domain).
- **`EvaluationResult.jsx`** — a detailed rubric-scored evaluation report page (criterion-by-criterion score/feedback, strengths/growth areas). Currently backed by hardcoded sample data (`evalData`) keyed by an id param, not a real backend endpoint yet.
- **`ManagerChatWidgetBase.jsx`** — the shared floating bottom-right manager-chat UI shell (collapsed FAB + expanded panel, unread badge/pulse, aria-live, Escape-to-close, mobile-responsive) — purely presentational; message content and reply generation are owned by the caller via `messages`/`onSend` props. Used by `sales-crm-sim`, `da-job-sim`, and `frontend-dev-sim`.
- **`SimManagerChat.jsx`** — the concrete manager-chat widget for simulations without their own zustand store (da-job-sim, frontend-dev-sim): local component-state messages, rule-based replies via `genericManagerChatKnowledge.js` — no AI/LLM call. Built on `ManagerChatWidgetBase`.
- **`genericManagerChatKnowledge.js`** — the rule-based reply engine `SimManagerChat` uses: keyword-intent regexes (greeting/thanks/score/criteria/done/hint/time/help) matched against free text, answered using only the current task's own data (message/whatToDo/whatToSubmit/hints/skills) — deliberately not AI.
- **`SimOnboarding.jsx`** — the offer-letter/onboarding acceptance screen shown before a student's first task (`useOnboarding`/`useAcceptOnboarding`).

##### `features/simulations/generic/`

The data-driven runtime that renders ANY CMS-authored simulation from its `SimulationTask.type` — this is what makes the CMS's task types actually playable, not just editable.

- **`taskTypeRegistry.js`** — the runtime's own type→component registry: one entry per task type (`text_rubric`/`structured_form`/`quiz`/`ai_roleplay_chat`/`crm_workspace`/`code_sandbox`) mapping to its `RendererComponent`. Read by both `GenericStageRenderer` and the CMS builder's palette.
- **`GenericSimShell.jsx`** — the full running-simulation page shell: header (exit/logo/task stepper/progress/elapsed time), enrollment-confirmation gating (re-validates against the server rather than trusting a possibly-stale persisted `enrollmentId`, re-enrolling if it 404s), the onboarding gate, the main `GenericStageRenderer`, the footer manager strip, and `SimManagerChat`. Renders `SimulationCompleteScreen` once `status === 'completed'`.
- **`GenericStageRenderer.jsx`** — dispatches to the right `RendererComponent` for `task.type` (via `taskTypeRegistry`), wrapped in the shared `GenericTaskHeader`. Handles the optional `post_task_quiz` gate — shown once a task's own component signals completion, before the completion is actually finalized, matching the pattern originally built for sales-crm-sim's stage-quiz gate.
- **`GenericStageChrome.jsx`** — `GenericTaskHeader` (title/objective/briefing/what-to-do/what-to-submit, no hardcoded stage count) and `GenericTaskFooterNav` — the shared chrome every task-type renderer sits inside.
- **`GenericSimOverview.jsx`** — the pre-enrollment `/simulations/:slug/overview` marketing/detail page: big title + company/manager/rating, week-grouped curriculum, plus overview modules `WhatYoullLearn`, `SimExplainerVideo`, `SimPricing`, `SimReviews` (some still use placeholder data modules).
- **`WhatYoullLearn.jsx`** / **`.test.jsx`** — learning outcomes section on the overview.
- **`SimExplainerVideo.jsx`** / **`.test.jsx`** — explainer video block on the overview.
- **`SimPricing.jsx`** / **`.test.jsx`** / **`placeholderPricing.js`** — pricing display (placeholder-backed until real billing).
- **`SimReviews.jsx`** / **`.test.jsx`** / **`placeholderReviews.js`** — reviews display (placeholder-backed).
- **`CodingEnvironmentPreview.jsx`** — preview chrome for coding environments in CMS preview paths.
- **`SimulationCompleteScreen.jsx`** — the terminal screen shown when every task is done: fetches the student's certificates, finds the one matching this simulation, and shows the `CredentialShield` + stats + copyable certificate number + PDF download + a link into the Portfolio — replacing an earlier dead-end "Simulation Complete!" screen that never checked for or displayed the certificate the backend had already issued.
- **`InteractiveSimPreview.jsx`** — the CMS admin's full-screen click-through preview of a DRAFT (or published) simulation. Deliberately NOT a reuse of `GenericSimShell` (which auto-enrolls on mount — would create a real `Enrollment` against a draft and block its deletion); keeps all progress in local component state only, nothing persists.
- **`ReferenceDataPanel.jsx`** — renders `task.reference_data`'s read-only "case file" content (a paragraph or tag/bullet list per field) alongside the interactive task — a generalized version of the original hardcoded sales-crm-sim Stage 1 "Lead file" card.
- **`ModelSolutionPanel.jsx`** — renders `task.model_solution`'s optional worked-example reveal (steps/key-principle/great-looks-like/example-solution), gated client-side behind a "show solution" button, with copy-to-clipboard on code/text blocks.
- **`TextRubricTask.jsx`** — long-form text submission (one free textarea, or named fields like subject/body/cta driven by `task.config.fields`), graded either by an LLM judge (`grading_mode: "llm"`, via `useGradeText`) or manually (marks complete, no auto score).
- **`StructuredFormTask.jsx`** — an admin-defined field list (text/textarea/number/select/slider/checkbox) — the generic version of sales-crm-sim's several structured-form stages. Manual/rubric grading only in v1.
- **`QuizTask.jsx`** — a standalone `type: "quiz"` task (pure knowledge check, no other content) — reuses `sales-crm-sim/stages/StageQuiz.jsx` as-is, always open since the quiz *is* the whole task.
- **`QuizPreviewTask.jsx`** — the CMS admin-preview stand-in for `QuizTask`: wraps the same `StageQuiz` component but with a real closable open state, since the real `QuizTask`'s hardcoded-open, no-op `onOpenChange` would trap an admin who's only trying to preview it while editing other fields.
- **`AiRoleplayChatTask.jsx`** — generic AI-roleplay chat (discovery calls, objection handling) — same UX pattern as sales-crm-sim's AI customer chat, but persona/context/mode come entirely from `task.config` rather than a hardcoded personality file, posting to the generic roleplay-message endpoint.
- **`CrmWorkspaceTask.jsx`** — thin wrapper reusing `sales-crm-sim`'s entire 10-module CRM mini-app; `task.config.required_entities` drives the completion gate instead of sales-crm-sim's own hardcoded criteria array. Known v1 limitation: still reads/writes the one global `useCrmSimStore` instance, so it isn't yet safe for two concurrently-open `crm_workspace` simulations.
- **`CodeSandboxTask.jsx`** — thin wrapper choosing the right existing sandbox editor (`JupyterPlayground` or `FrontendPlayground`) by `task.config.language`/`submission_mode` — both were already fully generic, so no changes were needed there. Grading happens server-side and already awards XP directly, so `onComplete` here passes `skipServerAward: true` to avoid double-awarding.
- **`CodeSandboxPreviewTask.jsx`** — the CMS admin-preview stand-in for `CodeSandboxTask`, deliberately not reusing `JupyterPlayground`/`FrontendPlayground` (both wired to enrollment-scoped submit endpoints, and there's no enrollment during preview) — only supports `declarative_rules` grading, the one strategy the preview-run-sandbox endpoint exposes.

##### `features/simulations/sales-crm-sim/`

The Enterprise SaaS Sales Representative job simulation (Nimbus CRM) — the one simulation that still has its own bespoke implementation rather than being fully generic, because its centerpiece (Stage 5's 10-module CRM mini-app) predates the generic runtime and is reused by it via `CrmWorkspaceTask` rather than rebuilt.

- **`engine/simulationConfig.js`** — `STAGES`, the stage/task/rubric schema for the whole simulation (objective/briefing/hints/rubric weights/success-criteria per stage) — read by `app/store/useCrmSimStore.js` and the manager-chat knowledge base.
- **`engine/eventLogger.js`** — `createEvent()`, an append-only event-log entry factory (nav/CRM-mutation/email-revision/retry/chat-turn/decision) — read back by scoring/replay logic.
- **`data/seedData.js`** — `SEED_LEAD`, the fixed scenario source material (Marcus Webb / Atlas Forge Manufacturing) the candidate reads through in the early stages before acting on it later.
- **`data/managerChatKnowledge.js`** — rule-based manager (Derek Holt) replies — the sales-sim-specific counterpart to `genericManagerChatKnowledge.js`, same keyword-intent-regex pattern, answering only from `simulationConfig.js`'s own stage data. Intentionally not AI.
- **`stages/StageQuiz.jsx`** — a 5-question knowledge check-in shown once right after a stage first completes, before the next unlocks — reinforces what just happened rather than letting "Continue" be a single unthinking click. Reused as-is by the generic runtime's `QuizTask`/`QuizPreviewTask` and by `GenericStageRenderer`'s post-task-quiz gate.
- **`stages/Stage5Crm/crmConstants.js`** — `PIPELINE_STAGES`, `STAGE_DEFAULT_PROBABILITY`, `STAGE_COLORS`, `formatCurrency`/`formatDate` helpers shared by every CRM screen below.
- **`stages/Stage5Crm/CrmShellLayout.jsx`** — the CRM mini-app's own shell: left nav across the 10 modules plus a `Cmd+K`-style command palette (`CommandDialog`) for quick navigation/search.
- **`stages/Stage5Crm/CrmDashboard.jsx`** — KPI tiles (revenue/targets/tasks/activity) plus a Recharts bar chart of pipeline-by-stage.
- **`stages/Stage5Crm/CrmLeads.jsx`**, **`CrmAccounts.jsx`**, **`CrmContacts.jsx`** — CRUD list/detail views for their respective CRM entities, all reading/writing the shared `useCrmSimStore`.
- **`stages/Stage5Crm/CrmActivities.jsx`**, **`CrmTasks.jsx`**, **`CrmCalendar.jsx`** — activity logging, task tracking, and a calendar view over the same store's events/tasks.
- **`stages/Stage5Crm/CrmOpportunities.jsx`** — opportunity list/detail with deal value and probability.
- **`stages/Stage5Crm/CrmPipeline.jsx`** — a drag-and-drop Kanban board (`@dnd-kit`) moving opportunities between `PIPELINE_STAGES` columns.
- **`stages/Stage5Crm/CrmReports.jsx`** — summary reporting views over the CRM data.

##### `features/simulations/da-job-sim/` and `features/simulations/frontend-dev-sim/`

- **`da-job-sim/JupyterPlayground.jsx`** — the Data Analyst simulation's code-sandbox editor: Monaco editor + a file explorer (directory listing, paginated CSV row viewer for large datasets, file download/upload up to the backend's 20MB cap), submit/run against `useSubmitSandbox`. Generic enough (enrollment/task-id props) that the shared `CodeSandboxTask` wrapper mounts it directly with no changes.
- **`frontend-dev-sim/FrontendPlayground.jsx`** — the Frontend Developer simulation's code-sandbox editor: Monaco editor for HTML/CSS/JS submissions, run/submit against the same `useSubmitSandbox` hook, resizable/expandable panel. Same generic-enough shape as `JupyterPlayground`, mounted by `CodeSandboxTask` based on `task.config.language`.
