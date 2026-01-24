-- DDL: Create user_question_stats table
DROP TABLE IF EXISTS user_question_stats CASCADE;

CREATE TABLE user_question_stats (
  user_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_question_stats_user_id ON user_question_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_stats_question_id ON user_question_stats(question_id);
CREATE INDEX IF NOT EXISTS idx_user_question_stats_user_question ON user_question_stats(user_id, question_id);
