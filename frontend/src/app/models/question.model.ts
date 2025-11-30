export interface Question {
  id: number;
  questionText: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  isActive: boolean;
}

export interface AnswerResult {
  isCorrect: boolean;
  message: string;
  questionId: number;
  correctAnswer: string;
}
