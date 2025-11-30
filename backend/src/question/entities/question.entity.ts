import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('questions')
export class QuestionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'question_type', type: 'varchar' })
  questionType: 'single_choice' | 'multiple_choice' | 'text_input';

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({ name: 'long_answer', type: 'text', nullable: true })
  longAnswer: string | null;

  @Column('text', { name: 'match_keywords', array: true, default: [] })
  matchKeywords: string[];

  @Column('varchar', { length: 20 })
  difficulty: 'easy' | 'medium' | 'hard';

  @Column('varchar', { length: 100 })
  topic: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
