export interface Question {
  id: number;
  questionText: string;
  longAnswer?: string | null;
  matchKeywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  isActive: boolean;
}

export interface QuestionWithoutAnswer {
  id: number;
  questionText: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  isActive: boolean;
}

export interface QuestionFilters {
  search?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string | string[];
}
