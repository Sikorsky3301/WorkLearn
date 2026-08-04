-- WorkLearn identity redesign — apply on a FRESH database (drop schema first).
-- Prefer: DROP SCHEMA public CASCADE; CREATE SCHEMA public; then run app create_all + seed,
-- or let the updated SQLAlchemy models create these tables via create_all.
--
-- Integer PKs/FKs everywhere. No UUID ids. No role_permissions. No institution* on users.

-- roles
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR NOT NULL UNIQUE,
  name        VARCHAR NOT NULL,
  description VARCHAR NULL,
  is_builtin  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (id, slug, name, description) VALUES
  (1, 'super_admin',      'Super Admin',      'Full platform access'),
  (2, 'admin',            'Admin',            'Platform administration'),
  (3, 'university_admin', 'University Admin', 'Manages one university'),
  (4, 'teacher',          'Teacher',          'Class mentor / teacher'),
  (5, 'student',          'Student',          'Learner')
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('roles', 'id'), (SELECT COALESCE(MAX(id), 1) FROM roles));

-- universities
CREATE TABLE IF NOT EXISTS universities (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR NOT NULL UNIQUE,
  name        VARCHAR NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_universities_one_default
  ON universities (is_default) WHERE is_default = TRUE;

INSERT INTO universities (id, code, name, is_default) VALUES
  (1, 'DEFAULT', 'WorkLearn Teaching Academy', TRUE)
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('universities', 'id'), (SELECT COALESCE(MAX(id), 1) FROM universities));

-- Drop obsolete identity tables if they still exist from an old schema
DROP TABLE IF EXISTS admin_role_permissions CASCADE;
DROP TABLE IF EXISTS admin_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS super_admin_credentials CASCADE;
