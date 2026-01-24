-- DDL: Create quiz_modes table
DROP TABLE IF EXISTS quiz_modes CASCADE;

CREATE TABLE quiz_modes (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  filters JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
