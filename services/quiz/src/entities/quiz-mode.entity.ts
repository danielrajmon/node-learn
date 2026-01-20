import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('quiz_modes')
export class QuizModeEntity {
  @PrimaryColumn({ name: 'id' })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ name: 'filters', type: 'jsonb', nullable: true })
  filters: Record<string, any>;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
