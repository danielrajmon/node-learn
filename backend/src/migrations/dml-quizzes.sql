-- Insert quiz modes based on the frontend quiz modes
INSERT INTO quiz_modes (id, name, description, filters) VALUES
('random', 'Random', 'Random questions', '{}'),
('code', 'Code-Based', 'Code questions', '{"practical": true}'),
('theory', 'Theoretical', 'Theoretical questions', '{"practical": false}'),
('easy', 'Easy', 'Easy difficulty', '{"difficulty": "easy"}'),
('medium', 'Medium', 'Medium difficulty', '{"difficulty": "medium"}'),
('hard', 'Hard', 'Hard difficulty', '{"difficulty": "hard"}'),
('single', 'Single Choice', 'Single choice questions', '{"questionType": "single_choice"}'),
('multi', 'Multiple Choice', 'Multiple choice questions', '{"questionType": "multiple_choice"}'),
('text', 'Text Input', 'Text input questions', '{"questionType": "text_input"}'),
('missed', 'Missed', 'Questions you got wrong', '{}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  filters = EXCLUDED.filters;
