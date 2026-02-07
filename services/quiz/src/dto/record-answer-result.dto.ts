export class RecordAnswerResultDto {
  success: boolean;
  awardedAchievements: Array<Record<string, unknown>>;
  leaderboardUpdated: boolean;
}
