export interface Choice {
  id?: number;
  choiceText: string;
  isGood: boolean;
}

export interface Question {
  id: number;
  questionType: 'single_choice' | 'multiple_choice' | 'text_input';
  questionText: string;
  longAnswer?: string;
  matchKeywords?: string[];
  keywordCount?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  isActive: boolean;
  choices?: Choice[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuestion {
  questionType: 'single_choice' | 'multiple_choice' | 'text_input';
  questionText: string;
  longAnswer?: string;
  matchKeywords?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  isActive?: boolean;
  choices?: Choice[];
}

export interface AnswerResult {
  isCorrect: boolean;
  message: string;
  questionId: number;
  correctAnswer: string;
}
