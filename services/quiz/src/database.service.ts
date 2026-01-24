import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

@Injectable()
export class DatabaseService implements OnModuleInit {
  private logger = new Logger('DatabaseService');
  private pool: Pool;

  async onModuleInit() {
    this.pool = new Pool({
      host: requireEnv('POSTGRES_HOST'),
      port: parseInt(requireEnv('POSTGRES_PORT'), 10),
      database: requireEnv('POSTGRES_DB'),
      user: requireEnv('POSTGRES_USER'),
      password: requireEnv('POSTGRES_PASSWORD'),
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
