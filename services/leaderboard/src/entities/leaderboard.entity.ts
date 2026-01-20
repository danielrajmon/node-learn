import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('leaderboards')
export class LeaderboardEntity {
  @PrimaryColumn({ name: 'quiz_mode_id', type: 'integer' })
  quizModeId: number;

  @PrimaryColumn({ name: 'position', type: 'integer' })
  position: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ name: 'correct_answers', type: 'integer' })
  correctAnswers: number;

  @Column({ name: 'total_questions', type: 'integer' })
  totalQuestions: number;

  @Column({ name: 'streak', type: 'integer' })
  streak: number;

  @Column({ name: 'achieved_at', type: 'timestamp' })
  achievedAt: Date;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
