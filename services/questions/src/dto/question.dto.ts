export class ChoiceDto {
  id: number;
  questionId?: number;
  choiceText: string;
  isGood: boolean;
  explanation?: string | null;
}

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
  keywordCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export class QuestionWithoutAnswerDto extends QuestionDto {}

