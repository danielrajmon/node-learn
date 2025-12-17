import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface Achievement {
  id: number;
  title: string;
  description: string;
  sprite_col: number;
  sprite_row: number;
  created_at: string;
}

@Injectable()
export class AchievementsService {
  constructor(private readonly dataSource: DataSource) {}

  async getAllAchievements(): Promise<Achievement[]> {
    const query = `
      SELECT 
        id,
        title,
        description,
        sprite_col,
        sprite_row,
        created_at
      FROM achievements
      ORDER BY id ASC
    `;

    return await this.dataSource.query(query);
  }
}
