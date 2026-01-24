DROP TABLE IF EXISTS user_question_stats;

CREATE TABLE user_question_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    
    CONSTRAINT fk_user_question_stats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_question_stats_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_question UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_question_stats_user_id ON user_question_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_stats_question_id ON user_question_stats(question_id);
