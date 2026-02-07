export class UserStatsOverviewDto {
  totalCorrect: number;
  totalIncorrect: number;
  totalAttempts: number;
  overallAccuracy: string;
}

export class UserStatsQuestionDto {
  id: number;
  question_id: number;
  question: string;
  topic: string;
  difficulty: string;
  correct_count: number;
  incorrect_count: number;
  accuracy_percentage: string;
}

export class UserStatsDto {
  overall: UserStatsOverviewDto;
  questions: UserStatsQuestionDto[];
}
