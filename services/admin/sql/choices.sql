DROP TRIGGER IF EXISTS trg_choices_touch_question ON choices;
DROP FUNCTION IF EXISTS touch_question_on_choice_change;
DROP INDEX IF EXISTS idx_choices_question_id;
DROP TABLE IF EXISTS choices;

CREATE TABLE choices (
    id           BIGSERIAL PRIMARY KEY,
    question_id  BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    choice_text  TEXT NOT NULL,
    is_good      BOOLEAN NOT NULL DEFAULT FALSE,
    explanation  TEXT
);

CREATE INDEX idx_choices_question_id ON choices (question_id);

CREATE OR REPLACE FUNCTION touch_question_on_choice_change()
RETURNS TRIGGER AS $$
DECLARE
    v_question_id BIGINT;
BEGIN
    v_question_id := COALESCE(NEW.question_id, OLD.question_id);

    UPDATE questions
    SET updated_at = NOW()
    WHERE id = v_question_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_choices_touch_question
AFTER INSERT OR UPDATE OR DELETE ON choices
FOR EACH ROW
EXECUTE FUNCTION touch_question_on_choice_change();