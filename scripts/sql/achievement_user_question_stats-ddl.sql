-- DDL: Projection table for achievements stats built from events
DROP TABLE IF EXISTS achievement_user_question_stats CASCADE;

CREATE TABLE achievement_user_question_stats (
  user_id VARCHAR(255) NOT NULL,
  question_id BIGINT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  practical BOOLEAN NOT NULL DEFAULT false,
  difficulty VARCHAR(20),
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  last_answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_auqs_user ON achievement_user_question_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_auqs_question_type ON achievement_user_question_stats(question_type);
CREATE INDEX IF NOT EXISTS idx_auqs_practical ON achievement_user_question_stats(practical);
