-- Create user_question_stats table to track user performance on questions
CREATE TABLE IF NOT EXISTS user_question_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    
    -- Foreign key constraints
    CONSTRAINT fk_user_question_stats_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_question_stats_question 
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    
    -- Unique constraint to ensure one record per user-question pair
    CONSTRAINT unique_user_question 
        UNIQUE(user_id, question_id)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_question_stats_user_id 
    ON user_question_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_stats_question_id 
    ON user_question_stats(question_id);
