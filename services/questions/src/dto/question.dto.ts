export class QuestionDto {
  id: number;
  questionType: 'single_choice' | 'multiple_choice' | 'text_input';
  practical: boolean;
  question: string;
  answer?: string | null;
  quiz?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  isActive: boolean;
  choices?: ChoiceDto[];
  keywordCount?: number;
  created_at?: string;
  updated_at?: string;
}

export class ChoiceDto {
  id: number;
  questionId: number;
  choiceText: string;
  explanation?: string | null;
}

export class QuestionWithoutAnswerDto extends QuestionDto {}

