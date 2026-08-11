# Test login accounts

Local demo users created by `python seed.py` from `backend/`.

**Password for every seeded account:** `password`

## One login entry point

Sign in at **`/login`** on the correct host. The host selects the tenant; the account role selects the portal.

| Host | Who can sign in at `/login` | Lands in |
|------|-----------------------------|----------|
| `http://localhost:5173` | Academy student, Platform Admin | `/dashboard` or `/admin` |
| `http://iitd.localhost:5173` | University student, Teacher, University Admin | `/dashboard`, `/mentor`, or `/university-admin` |

**Super Admin** stays separate: `http://localhost:5173/super-admin` (not the unified `/login`).

Legacy URLs `/university/login` and `/mentor/login` redirect to `/login`. Portals `/admin` and `/university-admin` are authenticated destinations only — unauthenticated visits bounce to `/login`.

## Admin ≠ University Admin

| | Platform Admin (`admin`) | University Admin (`university_admin`) |
|--|--------------------------|----------------------------------------|
| **Login host** | Academy `http://localhost:5173` → `/login` | Partner `{code}.localhost:5173` → `/login` |
| **Lands in** | `/admin` (full Admin portal) | `/university-admin` (org users only) |
| **Creates universities / subdomain codes** | Yes | No |
| **Creates university_admins** | Yes (onboard + provision) | No |
| **Provisions students & teachers** | Yes (any partner uni) | Yes (own university only) |
| **Platform tools** (sims, flags, config) | Yes | No |
| **Super Admin** | Does **not** manage universities | — |

## Hosts (tenants)

| Host | Tenant | Who can sign in (UI) |
|------|--------|----------------------|
| `http://localhost:5173` | WorkLearn Teaching Academy (default) | Student + Platform Admin (`/login`), Super Admin (`/super-admin`) |
| `http://iitd.localhost:5173` | IIT Delhi (`code=IITD`) | Student + Teacher + University Admin (`/login`) |

Modern Windows/macOS usually resolve `*.localhost` to loopback. If `iitd.localhost` does not open, add `127.0.0.1 iitd.localhost` to your hosts file. Vite uses `server.host: true` so partner subdomains work.

The API client sends `X-WorkLearn-Host: window.location.host` so the backend can resolve the tenant when the API runs on `localhost:3001`.

Re-running seed **resets** demo account passwords and roles (your own registered users are left alone).

## Accounts

| Role | Host | How to sign in | Goes to |
|------|------|----------------|---------|
| Academy student | `localhost:5173` | `/login` — `demo@worklearn.ai` / `password` | Dashboard |
| Super Admin | `localhost:5173` | `/super-admin` — `admin@worklearn.ai` / `password` | Super Admin |
| Platform Admin | `localhost:5173` | `/login` — `platform@worklearn.ai` / `password` | Admin |
| University Admin | `iitd.localhost:5173` | `/login` — `uniadmin@worklearn.ai` / `password` | University Admin |
| University student | `iitd.localhost:5173` | `/login` — `rahul@iitd.ac.in` / `password` | Dashboard |
| Teacher | `iitd.localhost:5173` | `/login` — `ananya@iitd.ac.in` / `password` | Mentor |

Also seeded: `priya@iitd.ac.in` (student, `python_sandbox` unlocked).

Partner student/teacher/university-admin logins use **email + password** (not roll_no / mentor_id).

Partner users **cannot** sign in on the academy host (and academy-only roles cannot use partner-only endpoints).

API: `POST /api/auth/login` (unified). Role-specific `/api/auth/login/*` aliases remain for compatibility. Super Admin: `POST /api/auth/login/superadmin`.

## Platform Admin — onboard a university

1. Sign in as Platform Admin on `localhost:5173/login`.
2. **Universities → Onboard University**: name, subdomain code, first University Admin credentials.
3. Code maps to `{code}.localhost:5173` and is **immutable** after create.
4. University Admin signs in on that partner host at `/login`, then uses `/university-admin` to provision students/teachers.

## Bulk upload (Excel / CSV)

Both portals have **Bulk upload** on the Users page. Download the auth-aware Excel template (includes sample rows), edit, then upload.

| Actor | Template | Allowed `role` values | University |
|-------|----------|----------------------|------------|
| Platform Admin | `worklearn_admin_bulk_template.xlsx` | `student`, `teacher`, `university_admin` | Per-row **`university_code`** in the file (e.g. `iitd`) |
| University Admin | `worklearn_uni_admin_bulk_template.xlsx` | `student`, `teacher` only | Always their org — **no** `university_code` (rejected if used to target another org) |

**Never** bulk-imported (rejected even if present in the file): `admin`, `super_admin`. University Admin also cannot import `university_admin`.

**Platform Admin columns:** `name`, `email`, `password`, `role`, `university_code`, `roll_no` (required for students), `department`, `section`, `year`.

**University Admin columns:** `name`, `email`, `password`, `role`, `roll_no`, `department`, `section`, `year` (no `university_code`).

Partial success: valid rows are created; failures are listed per row.

## How to seed

```powershell
cd backend
python seed.py
```

Requires Postgres via `backend/.env` (`DATABASE_URL`). Roles and universities are upserted by the seed script (and on API startup).

## Notes

- Self-register on academy `/login` creates a student on the default university.
- Super Admin does **not** create or manage universities.
