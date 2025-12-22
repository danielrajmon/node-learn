-- Leaderboard table for quiz modes
CREATE TABLE IF NOT EXISTS leaderboards (
  quiz_mode_id VARCHAR(50) NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 10),
  user_id INTEGER NOT NULL,
  streak INTEGER DEFAULT 0,
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (quiz_mode_id, position),
  FOREIGN KEY (quiz_mode_id) REFERENCES quiz_modes(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(quiz_mode_id, user_id)
);

-- Index for efficient leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboards_quiz_mode_id ON leaderboards(quiz_mode_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user_id ON leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_streak ON leaderboards(quiz_mode_id, streak DESC);
