-- WorkLearn local DB — see backend/.env for DATABASE_URL
-- 1. Click the elephant / PostgreSQL icon in the left Activity Bar
-- 2. Add or connect: localhost:5432 / worklearn / postgres (password in .env)
-- 3. With this file open: Connect → Run Query (Ctrl+Shift+E or the play button)

SELECT id, name, email, roll_no, role_id, university_id, is_active, created_at
FROM users
ORDER BY id;
