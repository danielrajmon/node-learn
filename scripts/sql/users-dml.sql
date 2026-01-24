-- DML: Seed guest user data
INSERT INTO users (id, google_id, email, name, picture, is_admin)
VALUES (
    1,
    'guest-user-placeholder',
    'guest@example.com',
    'Guest User',
    NULL,
    FALSE
)
ON CONFLICT (google_id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
