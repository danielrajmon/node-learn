-- DDL: Create questions table and supporting types
DROP TABLE IF EXISTS questions CASCADE;
DROP TYPE IF EXISTS question_type_enum CASCADE;
DROP TYPE IF EXISTS difficulty_enum CASCADE;

CREATE TYPE question_type_enum AS ENUM (
    'single_choice',
    'multiple_choice',
    'text_input'
);

CREATE TYPE difficulty_enum AS ENUM (
    'easy',
    'medium',
    'hard'
);

CREATE TABLE questions (
    id              BIGSERIAL PRIMARY KEY,
    question_type   question_type_enum NOT NULL,
    practical       BOOLEAN NOT NULL,
    difficulty      difficulty_enum NOT NULL,
    topic           TEXT NOT NULL,
    question        TEXT NOT NULL,
    answer          TEXT,
    quiz            TEXT,
    match_keywords  TEXT[],
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_questions_set_updated_at ON questions;
CREATE TRIGGER trg_questions_set_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION set_questions_updated_at();

CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_practical ON questions(practical);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON questions(is_active);
