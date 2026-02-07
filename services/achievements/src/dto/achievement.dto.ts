export class AchievementDto {
  id: number;
  title: string;
  description: string;
  sprite_col: number;
  sprite_row: number;
  created_at?: string;
}

export class AchievementProgressDto {
  current: number;
  total: number;
  label: string;
}

export class UserAchievementDto extends AchievementDto {
  unlocked: boolean;
  unlocked_at?: string;
  progress?: AchievementProgressDto;
}

export class AchievementCheckDto {
  userId: string | number;
  questionId: number;
  isCorrect: boolean;
  questionType?: string;
  practical?: boolean;
  difficulty?: string | null;
}

export class AchievementAwardResponseDto {
  awardedAchievements: AchievementDto[];
  awarded?: AchievementDto[];
}
