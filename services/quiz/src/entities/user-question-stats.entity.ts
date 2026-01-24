import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('user_question_stats')
export class UserQuestionStatsEntity {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn({ name: 'question_id' })
  questionId: number;

  @Column({ name: 'correct_count', type: 'integer', default: 0 })
  correctCount: number;

  @Column({ name: 'incorrect_count', type: 'integer', default: 0 })
  incorrectCount: number;

  // Note: No relation to QuestionEntity to avoid cross-database constraints.
  // Question details are fetched via a separate connection to the questions DB.
}
