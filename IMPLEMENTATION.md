# WorkAlearn — Full Platform Implementation Blueprint

## 1. Project Overview

WorkAlearn is a skills-based learning platform built on job simulations, courses, and AI mentoring. It serves two distinct audiences:

| Audience | Entry Point | Auth |
|---|---|---|
| **Direct Users** | `/login` | Email + Password |
| **University Students** | `/university/login` | Roll No + Dept + Section |
| **Class Mentors** | `/university/login` (mentor ID) | Mentor ID + Password |
| **Super Admin** | `/login` (admin email) | Email + Password |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser Client                      │
│                   React 18 + Vite + Tailwind             │
├──────────────────┬──────────────────────────────────────┤
│  Direct Platform │       University Portal              │
│  /dashboard      │       /university/portal             │
│  /courses        │       Assigned Tasks                 │
│  /simulations    │       Locked Feature Gates           │
│  /portfolio      │       Mentor Communication           │
├──────────────────┴──────────────────────────────────────┤
│               AuthContext (React Context)                │
│   - User role (direct / university_student / mentor)    │
│   - Feature flags per role                              │
│   - Mentor-unlocked overrides per student               │
├─────────────────────────────────────────────────────────┤
│              Super Admin  /superadmin                    │
│   - All user management (direct + university)           │
│   - University partner management                       │
│   - Global feature gate controls                        │
│   - Analytics across both audiences                     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. User Roles & Access

### 3.1 Direct User
- Full access to all courses, simulations, Python sandbox, model solutions, certificates
- No institutional affiliation
- Self-paced, no mentor oversight

### 3.2 University Student
- Access gated by mentor assignments + feature unlocks
- **Default locked:** Python Sandbox, Model Solutions, Certificates, non-assigned courses
- **Always open:** Task briefs, hints, quiz, dataset download
- Sees "Assigned Tasks" section at top of portal
- Can request feature unlocks from Class Mentor

### 3.3 Class Mentor (University)
- Can assign courses and simulations to their section
- Can unlock specific features per student or per class
- Can approve/reject student feature unlock requests
- Sees progress dashboard for their section
- Cannot access super admin

### 3.4 Super Admin
- Manages all university partnerships (add/suspend/configure)
- Manages global feature gates
- Views analytics across both direct and university audiences
- Can impersonate any user role for debugging
- Full CRUD on all platform content

---

## 4. Feature Gate System

Features are gated at two levels:

**Level 1 — Role gate** (hard-coded per role):
```
Feature               Direct  Uni-Student  Mentor  Admin
─────────────────────────────────────────────────────────
Python Sandbox          ✓         🔒          ✓       ✓
Download Dataset        ✓         ✓           ✓       ✓
Model Solution Reveal   ✓         🔒          ✓       ✓
Certificate Issue       ✓         🔒          ✓       ✓
All Courses Visible     ✓         🔒          ✓       ✓
Task Assignment               —           ✓       ✓
Admin Panel                   —                   ✓
```

**Level 2 — Mentor unlock** (runtime, per student):
- Mentor can toggle any locked feature ON for their section or individual student
- Stored in `user.unlockedFeatures[]` array
- `hasFeature(name)` in AuthContext checks role default then mentor overrides

---

## 5. Page & Route Map

```
/                          → redirect /dashboard
/login                     → Direct user + Admin login
/university/login          → University student + Mentor login

── Direct Platform (requires DIRECT_USER or above) ──────
/dashboard                 → Main dashboard
/courses                   → Course catalog
/courses/:id               → Course detail
/simulations               → Simulation browser
/simulations/da-job-sim    → DA Job Simulation workspace
/portfolio                 → Portfolio
/ai-mentor                 → AI career mentor
/skill-gps                 → Skill map
/analytics                 → Learning analytics
/interview-prep            → Interview prep
/community                 → Community
/settings                  → User settings

── University Portal (requires UNIVERSITY_STUDENT) ───────
/university/portal         → Student home (assigned tasks + locked catalog)

── Mentor Portal (requires CLASS_MENTOR) ─────────────────
/mentor                    → Mentor dashboard
  ↳ My Class               → Student roster + progress
  ↳ Assignments            → Create/manage assignments
  ↳ Unlock Requests        → Approve/deny feature requests
  ↳ Reports                → Section-level analytics

── Super Admin (requires SUPER_ADMIN) ───────────────────
/superadmin                → Admin dashboard
  ↳ Overview               → Platform-wide stats
  ↳ Universities           → Partner university management
  ↳ Direct Users           → Direct user management
  ↳ Students               → All university students
  ↳ Feature Gates          → Global feature toggle controls
  ↳ Analytics              → Charts and cohort analysis
  ↳ Settings               → Platform configuration
```

---

## 6. Data Models

### User (Direct)
```js
{
  id: string,
  email: string,
  name: string,
  role: 'direct_user' | 'super_admin',
  createdAt: date,
  completedCourses: string[],
  completedSimulations: string[],
  certificatesEarned: string[],
}
```

### User (University Student)
```js
{
  id: string,
  rollNo: string,           // Primary login credential
  name: string,
  institution: string,
  department: string,       // CSE, ECE, MBA, etc.
  section: string,          // A, B, CS-3A, etc.
  year: string,             // 1st, 2nd, 3rd, 4th
  mentorId: string,
  role: 'university_student',
  unlockedFeatures: string[],  // Features unlocked by mentor
  assignedTasks: Assignment[],
}
```

### Assignment
```js
{
  id: string,
  type: 'course' | 'simulation' | 'reading',
  resourceId: string,        // course id or simulation id
  title: string,
  assignedBy: string,        // mentorId
  assignedAt: date,
  dueDate: date,
  status: 'pending' | 'in_progress' | 'completed',
  studentProgress: number,   // 0–100
}
```

### University
```js
{
  id: string,
  name: string,
  code: string,              // IITD, BITS, etc.
  plan: 'basic' | 'pro' | 'enterprise',
  studentsCount: number,
  mentorsCount: number,
  enabledFeatures: string[], // platform-level feature list
  activeFrom: date,
  status: 'active' | 'suspended' | 'trial',
}
```

### ClassMentor
```js
{
  id: string,
  name: string,
  email: string,
  institution: string,
  department: string,
  section: string,
  role: 'class_mentor',
  studentIds: string[],
  pendingUnlockRequests: UnlockRequest[],
}
```

### UnlockRequest
```js
{
  id: string,
  studentId: string,
  studentName: string,
  featureName: string,
  taskContext: string,       // "Task 2 — Sales Report"
  requestedAt: date,
  status: 'pending' | 'approved' | 'denied',
}
```

---

## 7. AuthContext API

```js
const { 
  user,              // current user object or null
  loginDirect,       // (email, password) → { success } | { error }
  loginUniversity,   // (rollNo, dept, section, password) → { success } | { error }
  logout,            // () → void
  hasFeature,        // (featureName: string) → boolean
} = useAuth()
```

---

## 8. Component Library (existing + new)

### Existing (from main platform)
- `<LumenLogo>` — Lumen Corporation brand mark
- `<JupyterPlayground>` — In-browser Python (Pyodide)
- `<DASimulationWorkspace>` — Full simulation workspace

### New Components
- `<LockedFeature name reason>` — Wraps any content with a lock overlay
- `<AssignedTaskCard>` — Shows a mentor-assigned task with progress bar
- `<FeatureGateToggle>` — SuperAdmin toggle switch per feature/role
- `<StudentRow>` — Row in mentor's class roster with progress
- `<UnlockRequestCard>` — Mentor approve/deny widget
- `<UniversityBadge institution>` — Institutional header chip

---

## 9. University Login Info Collected

At login time, university students provide:
1. **Roll Number** (e.g. `21CS001`) — primary identifier
2. **Department** — dropdown (CSE, ECE, ME, Civil, MBA, etc.)
3. **Section** — text (A / B / CS-3A)
4. **Password** — set during institution onboarding

Additional profile fields (set by institution admin, not entered at login):
- Full Name, Academic Year, College Email, Batch

---

## 10. University Onboarding Flow (Institution)

```
Super Admin creates University
  ↓
Generates institution code (e.g. IITD-2025)
  ↓
Super Admin creates ClassMentor accounts (bulk CSV or manual)
  ↓
Mentor logs in → creates/imports student roster
  ↓
Students get roll number + temp password from institution
  ↓
Students log in at /university/login
  ↓
Student lands on /university/portal with assigned tasks
```

---

## 11. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build | Vite 5 |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| State | React Context (AuthContext) |
| In-browser Python | Pyodide v0.26.4 |
| Data Science | pandas, numpy, matplotlib |
| Dataset gen | Pure JS (Mulberry32 PRNG, seed 42) |
| Auth (prod) | Replace mock with Clerk / Supabase Auth |
| Database (prod) | Supabase / PostgreSQL |
| Hosting | Vercel / Netlify (static) |

---

## 12. Production Upgrade Path

The current codebase uses **mock auth** (hardcoded credentials in AuthContext). To go production:

1. **Replace** `loginDirect()` with Clerk `signIn()` or Supabase `auth.signIn()`
2. **Replace** `loginUniversity()` with custom Supabase RPC that validates roll no + institution
3. **Replace** in-memory `unlockedFeatures[]` with Supabase row in `feature_grants` table
4. **Replace** mock assignment data with Supabase `assignments` table queries
5. **Add** JWT validation on any server-side routes
6. **Add** Row-Level Security in Supabase so students can only see their own data

---

## 13. File Structure

```
project_workAlearn/
├── IMPLEMENTATION.md          ← this file
├── src/
│   ├── App.jsx                ← all routes
│   ├── main.jsx
│   ├── index.css
│   ├── contexts/
│   │   └── AuthContext.jsx    ← auth + feature flags
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── JupyterPlayground.jsx
│   ├── pages/
│   │   ├── Login.jsx           ← direct user login
│   │   ├── UniversityLogin.jsx ← university login (roll no + dept + section)
│   │   ├── SuperAdmin.jsx      ← admin dashboard
│   │   ├── ClassMentor.jsx     ← mentor task assignment + unlock approvals
│   │   ├── UniversityPortal.jsx← student portal (locked features)
│   │   ├── Dashboard.jsx
│   │   ├── CourseCatalog.jsx
│   │   ├── CourseDetails.jsx
│   │   ├── DASimulationWorkspace.jsx
│   │   └── ... (other existing pages)
│   └── utils/
│       └── generateDataset.js
└── public/
```
