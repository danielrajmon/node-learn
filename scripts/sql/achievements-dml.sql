-- DML: Seed achievements data
DELETE FROM achievements;

INSERT INTO achievements (id, title, description, sprite_col, sprite_row) VALUES
(1, 'First Steps', 'Answered your first single choice question.', 0, 0),
(2, 'Lucky Guess', 'Answered your first multi-choice question.', 1, 0),
(3, 'You Did the Thing', 'Answered your first text input question.', 2, 0),
(4, 'Easy Peasy', 'Mastered all easy-level questions.', 3, 0),
(5, 'Redemption Arc', 'Answered a previously missed question correctly.', 4, 0),
(6, 'Click Clicker', 'Answered 10 single choice questions correctly.', 5, 0),
(7, 'Brain Overload', 'Answered 10 multi-choice questions correctly.', 6, 0),
(8, 'Keyboard Warrior', 'Answered 10 text input questions correctly.', 0, 1),
(9, 'X Marks the Spot', 'Answered 10 questions correctly.', 1, 1),
(10, 'Getting There', 'Mastered all medium-level questions.', 2, 1),
(11, 'Clickety Click', 'Answered 25 single choice questions correctly.', 3, 1),
(12, 'Choice Champion', 'Answered 25 multi-choice questions correctly.', 4, 1),
(13, 'Type Master', 'Answered 25 text input questions correctly.', 5, 1),
(14, 'Quiz Legend', 'Answered 100 questions correctly.', 6, 1),
(15, 'Code Wizard', 'Mastered all code-based questions.', 0, 2),
(16, 'Book Smarts', 'Mastered all theoretical questions.', 1, 2),
(17, 'Single Threat', 'Mastered all single choice questions.', 2, 2),
(18, 'Multiple Personality', 'Mastered all multi-choice questions.', 3, 2),
(19, 'Type Champion', 'Mastered all text input questions.', 4, 2),
(20, 'Masochist', 'Completed all hard-level questions.', 5, 2),
(50, 'NodeJS Ninja', 'You are now well prepared for a NodeJS interview!', 6, 2);
