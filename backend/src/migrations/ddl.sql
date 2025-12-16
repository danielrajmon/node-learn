DROP TRIGGER IF EXISTS trg_questions_set_updated_at ON questions;
DROP TRIGGER IF EXISTS trg_choices_touch_question ON choices;
DROP FUNCTION IF EXISTS set_questions_updated_at;
DROP FUNCTION IF EXISTS touch_question_on_choice_change;
DROP INDEX IF EXISTS idx_choices_question_id;
DROP TABLE IF EXISTS choices;
DROP TABLE IF EXISTS questions;
DROP TYPE IF EXISTS difficulty_enum;
DROP TYPE IF EXISTS question_type_enum;

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

-- Create QUESTIONS table
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

-- Create CHOICES table (1-to-many from QUESTIONS)
CREATE TABLE choices (
    id           BIGSERIAL PRIMARY KEY,
    question_id  BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    choice_text  TEXT NOT NULL,
    is_good      BOOLEAN NOT NULL DEFAULT FALSE,
    explanation  TEXT
);

-- Create index
CREATE INDEX idx_choices_question_id
    ON choices (question_id);

-- Function: set updated_at on questions when the row changes
CREATE OR REPLACE FUNCTION set_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on questions
CREATE TRIGGER trg_questions_set_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION set_questions_updated_at();

-- Function: when a choice changes, update the parent question's updated_at
CREATE OR REPLACE FUNCTION touch_question_on_choice_change()
RETURNS TRIGGER AS $$
DECLARE
    v_question_id BIGINT;
BEGIN
    -- NEW for INSERT/UPDATE, OLD for DELETE
    v_question_id := COALESCE(NEW.question_id, OLD.question_id);

    UPDATE questions
    SET updated_at = NOW()
    WHERE id = v_question_id;

    -- AFTER triggers don't need to modify the row, so NULL is fine
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on choices
CREATE TRIGGER trg_choices_touch_question
AFTER INSERT OR UPDATE OR DELETE ON choices
FOR EACH ROW
EXECUTE FUNCTION touch_question_on_choice_change();