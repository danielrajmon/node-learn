export class LeaderboardUpdateDto {
  modeId: string;
  userId: number;
  correctAnswers: number;
  totalQuestions: number;
  correctAnswersCount: number;
  username: string;
}

export class LeaderboardUpdateResponseDto {
  success: boolean;
}

export class LeaderboardEntryDto {
  quiz_mode_id: string;
  position: number;
  user_id: number;
  correct_answers: number;
  total_questions: number;
  correct_answers_count: number;
  achieved_at: string;
  username?: string;
}
