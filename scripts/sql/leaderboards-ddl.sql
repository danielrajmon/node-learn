-- DDL: Create leaderboards table (per quiz mode, ordered by position)
DROP TABLE IF EXISTS leaderboards CASCADE;

CREATE TABLE leaderboards (
  quiz_mode_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers_count INTEGER NOT NULL DEFAULT 0,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (quiz_mode_id, position)
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_user_id ON leaderboards(user_id);
