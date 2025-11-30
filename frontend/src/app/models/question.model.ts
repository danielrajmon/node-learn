export interface Question {
  id: number;
  questionType: 'single_choice' | 'multiple_choice' | 'text_input';
  questionText: string;
  longAnswer?: string;
  matchKeywords?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
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
