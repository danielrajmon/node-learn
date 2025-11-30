export interface Question {
  id: number;
  questionText: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  isActive: boolean;
}

export interface CreateQuestion {
  questionType: 'single_choice' | 'multiple_choice' | 'text_input';
  questionText: string;
  longAnswer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  isActive?: boolean;
}

export interface AnswerResult {
  isCorrect: boolean;
  message: string;
  questionId: number;
  correctAnswer: string;
}
