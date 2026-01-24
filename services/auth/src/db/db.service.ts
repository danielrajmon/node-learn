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
    const isAdmin = params.email === 'daniel@rajmon.com';
    const { rows } = await this.pool.query<DbUserRow>(
      `INSERT INTO users (google_id, email, name, picture, is_admin)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [params.googleId, params.email, params.name, params.picture ?? null, isAdmin],
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

  async updateUserAdmin(userId: number, isAdmin: boolean): Promise<void> {
    await this.pool.query(
      'UPDATE users SET is_admin = $1 WHERE id = $2',
      [isAdmin, userId],
    );
  }
}
