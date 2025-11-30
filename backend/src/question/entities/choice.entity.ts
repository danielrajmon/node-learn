import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { QuestionEntity } from './question.entity';

@Entity('choices')
export class ChoiceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'question_id' })
  questionId: number;

  @Column({ name: 'choice_text', type: 'text' })
  choiceText: string;

  @Column({ name: 'is_good', type: 'boolean', default: false })
  isGood: boolean;

  @ManyToOne(() => QuestionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: QuestionEntity;
}
