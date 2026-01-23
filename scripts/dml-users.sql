-- Delete all users and reset the sequence
DELETE FROM users;
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Insert guest user with ID 1
INSERT INTO users (id, google_id, email, name, picture, is_admin)
VALUES (
    1,
    'guest-user',
    'guest@node-learn.local',
    'Guest User',
    NULL,
    FALSE
);