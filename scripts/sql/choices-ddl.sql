-- DDL: Create choices table
DROP TABLE IF EXISTS choices CASCADE;

CREATE TABLE choices (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL,
    choice_text TEXT NOT NULL,
    is_good BOOLEAN NOT NULL DEFAULT FALSE,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_choices_question_id FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_choices_question_id ON choices(question_id);

CREATE OR REPLACE FUNCTION set_choices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_choices_set_updated_at ON choices;
CREATE TRIGGER trg_choices_set_updated_at
BEFORE UPDATE ON choices
FOR EACH ROW
EXECUTE FUNCTION set_choices_updated_at();
