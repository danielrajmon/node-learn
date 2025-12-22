-- Quiz modes table
CREATE TABLE IF NOT EXISTS quiz_modes (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  filters JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);