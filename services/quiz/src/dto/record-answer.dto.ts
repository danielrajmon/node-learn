export class RecordAnswerDto {
  userId: string;
  questionId: number;
  selectedChoiceId: number;
  quizModeId: number;
  isCorrect: boolean;
}
