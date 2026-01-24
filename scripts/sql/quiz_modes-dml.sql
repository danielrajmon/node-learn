-- DML: Seed quiz modes data
DELETE FROM quiz_modes;

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
