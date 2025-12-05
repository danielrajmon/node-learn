export interface Question {
  id: number;
  question: string;
  answer?: string | null;
  quiz?: string | null;
  matchKeywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  isActive: boolean;
}

export interface QuestionWithoutAnswer {
  id: number;
  question: string;
  quiz?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  isActive: boolean;
}

export interface QuestionFilters {
  search?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string | string[];
}
