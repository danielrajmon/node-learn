DROP TABLE IF EXISTS leaderboards;

CREATE TABLE leaderboards (
  quiz_mode_id INTEGER NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 6),
  user_id INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  streak INTEGER NOT NULL,
  achieved_at TIMESTAMP NOT NULL,
  PRIMARY KEY (quiz_mode_id, position),
  FOREIGN KEY (quiz_mode_id) REFERENCES quiz_modes(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(quiz_mode_id, user_id)
);