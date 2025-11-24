import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('questions')
export class QuestionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;

  @Column('varchar', { length: 20 })
  difficulty: string;

  @Column('text', { array: true })
  topics: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
