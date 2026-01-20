import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export interface DbUserRow {
  id: number;
  google_id: string;
  email: string;
  name: string;
  picture: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL || this.config.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined for auth service');
    }
    this.pool = new Pool({ connectionString });
    // simple connectivity check
    await this.pool.query('SELECT 1');
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async findUserByEmail(email: string): Promise<DbUserRow | null> {
    const { rows } = await this.pool.query<DbUserRow>(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email],
    );
    return rows[0] || null;
  }

  async findUserByGoogleId(googleId: string): Promise<DbUserRow | null> {
    const { rows } = await this.pool.query<DbUserRow>(
      'SELECT * FROM users WHERE google_id = $1 LIMIT 1',
      [googleId],
    );
    return rows[0] || null;
  }

  async createUser(params: {
    googleId: string;
    email: string;
    name: string;
    picture?: string | null;
  }): Promise<DbUserRow> {
    const { rows } = await this.pool.query<DbUserRow>(
      `INSERT INTO users (google_id, email, name, picture)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [params.googleId, params.email, params.name, params.picture ?? null],
    );
    return rows[0];
  }

  async updateGoogleIdIfMissing(userId: number, googleId: string): Promise<void> {
    await this.pool.query(
      "UPDATE users SET google_id = $1 WHERE id = $2 AND COALESCE(google_id, '') = ''",
      [googleId, userId],
    );
  }

  async findUserById(id: number): Promise<DbUserRow | null> {
    const { rows } = await this.pool.query<DbUserRow>(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id],
    );
    return rows[0] || null;
  }
}
