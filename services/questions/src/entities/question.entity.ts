import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ChoiceEntity } from './choice.entity';

@Entity('questions')
export class QuestionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'question_type', type: 'varchar' })
  questionType: 'single_choice' | 'multiple_choice' | 'text_input';

  @Column({ name: 'practical', type: 'boolean' })
  practical: boolean;

  @Column({ name: 'question', type: 'text' })
  question: string;

  @Column({ name: 'answer', type: 'text', nullable: true })
  answer: string | null;

  @Column({ name: 'quiz', type: 'text', nullable: true })
  quiz: string | null;

  @Column('text', { name: 'match_keywords', array: true, nullable: true, default: () => 'ARRAY[]::text[]' })
  matchKeywords: string[] | null;

  @Column('varchar', { length: 20 })
  difficulty: 'easy' | 'medium' | 'hard';

  @Column('varchar', { length: 100 })
  topic: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ChoiceEntity, choice => choice.question, { cascade: true })
  choices: ChoiceEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
