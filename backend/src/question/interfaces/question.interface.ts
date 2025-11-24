export interface Question {
  id: number;
  difficulty: 'junior' | 'medior' | 'senior';
  question: string;
  answer: string;
  topics: string[];
}

export interface QuestionFilters {
  search?: string;
  difficulty?: 'junior' | 'medior' | 'senior';
  topic?: string | string[];
}
