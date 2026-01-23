import { ChoiceDto } from './choice.dto';

export class QuestionDto {
  id: number;
  questionType: 'single_choice' | 'multiple_choice' | 'text_input';
  practical: boolean;
  question: string;
  answer: string | null;
  quiz: string | null;
  matchKeywords: string[] | null;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  isActive: boolean;
  choices: ChoiceDto[];
}

export interface QuestionFilters {
  search?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string[];
}
