export interface Question {
  id: number;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  topics: string[];
}

export interface AnswerResult {
  isCorrect: boolean;
  message: string;
  questionId: number;
  correctAnswer: string;
}
