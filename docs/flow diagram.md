# WorkLearn frontend flow

User-facing frontend flow for WorkLearn, based on `AppProviders` → `AppRouter` → role guards.

**Key entry files**

- `frontend/src/main.jsx` — mounts providers + router
- `frontend/src/app/providers/AppProviders.jsx` — Auth → app (`TenantProvider` exists but is not mounted today)
- `frontend/src/app/router/AppRouter.jsx` — routes
- `frontend/src/app/router/guards/ProtectedRoute.jsx` — auth + role + onboarding gate
- `frontend/src/features/auth/global/Login.jsx` — academy student sign-in / sign-up
- `frontend/src/features/auth/university/UniversityLogin.jsx` — partner student login
- `frontend/src/features/auth/university/MentorLogin.jsx` — partner teacher login

---

## Hosts → who can sign in

| Host | Sign-in surfaces | Roles |
|------|------------------|--------|
| `localhost:5173` (academy) | `/login`, `/admin`, `/super-admin` | Student, Platform Admin, Super Admin |
| Partner subdomain (e.g. `iitd.localhost:5173`) | `/university/login`, `/mentor/login`, `/admin` | Student, Teacher, University Admin |

**Platform Admin ≠ University Admin.** Academy `/admin` is the full Admin portal. Partner `/admin` authenticates `university_admin` and redirects to `/university-admin` (org users only).

---

## Bootstrap → role routing

```mermaid
flowchart TD
  A[Browser loads app] --> B[AppProviders]
  B --> F[AuthProvider<br/>session token?]
  F -->|No token| G{Entry}
  F -->|Token| H[GET /api/auth/me]
  H -->|Fail| G
  H -->|OK| I{Role?}

  G -->|Academy| L1[/login]
  G -->|Partner student| L2[/university/login]
  G -->|Partner teacher| L3[/mentor/login]
  G -->|Partner uni admin| L4[/admin → AdminPortalLogin]

  I -->|super_admin| SA[/super-admin/*]
  I -->|admin| AD[/admin/*]
  I -->|university_admin| UA[/university-admin/*]
  I -->|teacher| TE[/mentor]
  I -->|student| ST{onboarding_completed?}

  ST -->|No| OB[/onboarding]
  ST -->|Yes| DB[/dashboard]
```

---

## Login by persona

```mermaid
flowchart LR
  L[Login entry] --> T{Host}

  T -->|Academy localhost:5173| A1[/login · Student]
  T -->|Academy| A2[/admin → AdminPortalLogin]
  T -->|Academy| A3[/super-admin → SuperAdminLogin]

  T -->|Partner e.g. iitd.localhost| P1[/university/login · Student]
  T -->|Partner| P2[/mentor/login · Teacher]
  T -->|Partner| P3[/admin → University Admin login]

  A1 --> R1[student → /dashboard<br/>or /onboarding]
  A2 --> R3[admin → /admin]
  A3 --> R4[super_admin → /super-admin]
  P1 --> R1
  P2 --> R2[teacher → /mentor]
  P3 --> R5[university_admin → /university-admin]
```

---

## Student journey

```mermaid
flowchart TD
  OB[/onboarding] --> W[welcome → profile → contact<br/>→ domain → education → review]
  W --> DB[/dashboard]

  DB --> SIM[/simulations]
  SIM --> OV[/simulations/:slug/overview]
  OV --> RUN[/simulations/:slug]
  RUN --> EVAL[/evaluations/:id]

  DB --> PORT[/portfolio]
  DB --> AIM[/ai-mentor]
  DB --> GPS[/skill-gps]
  DB --> AN[/analytics]
  DB --> COM[/community]
  DB --> SET[/settings]

  DB --> MIRA[/mira]
  MIRA --> MS[/mira/setup]
  MS --> SES[/mira/session]
  SES --> RES[/mira/results]

  PORT --> SET
  PORT --> SIM
```

---

## Admin / University Admin / Super Admin / Teacher shells

```mermaid
flowchart TD
  subgraph Admin["Platform Admin (academy)"]
    A0[/admin] --> A1[Overview / Users / Universities onboard]
    A0 --> A2[Simulations / Feature Flags / Analytics]
    A0 --> A3[Activity / Configuration]
    A0 --> A4[/admin/simulations/:id<br/>CMS editor]
    A0 --> A5[/admin/sim-builder<br/>Sim Builder]
  end

  subgraph UniAdmin["University Admin (partner)"]
    U0[/university-admin] --> U1[Overview]
    U0 --> U2[Users · provision students/teachers]
  end

  subgraph SuperAdmin
    S0[/super-admin] --> S1[Overview / Analytics]
    S0 --> S2[Direct Users / All Students]
    S0 --> S3[Admins / Roles / Activity / Audit]
  end

  subgraph Teacher["Teacher (partner)"]
    T0[/mentor] --> T1[Class Mentor]
  end
```

---

## Guard rules

| Guard | Who passes | If blocked |
|--------|------------|------------|
| `ProtectedRoute` | Logged-in non-admin roles (students, teachers, …) | → `/login` if anonymous; `super_admin` → `/super-admin`; `admin` → `/admin`; `university_admin` → `/university-admin` |
| Same + student | `onboarding_completed === false` | Forced to `/onboarding` |
| `RequireAdmin` | `admin`, `super_admin` only; `university_admin` redirected to `/university-admin` | Shows `AdminPortalLogin` |
| `RequireUniversityAdmin` | `university_admin` only | Shows `AdminPortalLogin` |
| `RequireSuperAdmin` | `super_admin` only | Shows `SuperAdminLogin` |
| `PublicOnlyRoute` | Logged-out visitors on marketing `/` | Signed-in users → `/dashboard` |

Platform Admin and University Admin are **different roles and portals** — do not treat them as the same persona with a smaller menu.

---

## Layout notes

- Marketing `/`, `/about`, `/institutions`, `/contact`, `/blog` use marketing chrome (not app Navbar).
- Students use `MainLayout` (Navbar + Footer).
- Onboarding, mentor, and admin portals are full-screen without that chrome.
- Live sim runs and `/mira/session` hide the global footer.
