DROP TABLE IF EXISTS quiz_modes;

CREATE TABLE quiz_modes (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  filters JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO quiz_modes (id, name, description, filters) VALUES
(1, 'Single Choice', 'Single choice questions', '{"questionType": "single_choice"}'),
(2, 'Multiple Choice', 'Multiple choice questions', '{"questionType": "multiple_choice"}'),
(3, 'Text Input', 'Text input questions', '{"questionType": "text_input"}'),
(4, 'Easy', 'Easy difficulty', '{"difficulty": "easy"}'),
(5, 'Medium', 'Medium difficulty', '{"difficulty": "medium"}'),
(6, 'Hard', 'Hard difficulty', '{"difficulty": "hard"}'),
(7, 'Code-Based', 'Code questions', '{"practical": true}'),
(8, 'Theoretical', 'Theoretical questions', '{"practical": false}'),
(9, 'Random', 'Random questions', '{}'),
(10, 'Missed', 'Questions you got wrong', '{}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  filters = EXCLUDED.filters;
