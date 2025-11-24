export interface Question {
  id: number;
  difficulty: 'junior' | 'medior' | 'senior';
  question: string;
  topics: string[];
}

export interface AnswerResult {
  isCorrect: boolean;
  message: string;
  questionId: number;
  correctAnswer: string;
}
