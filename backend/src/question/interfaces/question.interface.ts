export interface Question {
  id: number;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  answer: string;
  topics: string[];
}

export interface QuestionWithoutAnswer {
  id: number;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  topics: string[];
}

export interface QuestionFilters {
  search?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string | string[];
}
