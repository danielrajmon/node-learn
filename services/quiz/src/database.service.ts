import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private logger = new Logger('DatabaseService');
  private pool: Pool;

  async onModuleInit() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'node_learn_db',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    try {
      const client = await this.pool.connect();
      this.logger.log('Connected to PostgreSQL');
      client.release();
    } catch (error) {
      this.logger.error(`Failed to connect to PostgreSQL: ${error.message}`);
    }
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      this.logger.debug(`Query executed in ${duration}ms`);
      return res;
    } catch (error) {
      this.logger.error(`Query failed: ${error.message}`);
      throw error;
    }
  }

  async getClient() {
    return this.pool.connect();
  }
}
