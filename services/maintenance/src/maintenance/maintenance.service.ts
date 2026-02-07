import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { execSync } from 'child_process';

@Injectable()
export class MaintenanceService {
  private logger = new Logger('MaintenanceService');

  constructor(private readonly dataSource: DataSource) {}

  @Cron('0 0 * * *')  // Runs every day at midnight (00:00 UTC)
  async resetGuestUserDaily(): Promise<void> {
    try {
      const guestId = await this.getGuestUserId();

      // Delete achievements
      await this.dataSource.query(
        'DELETE FROM user_achievements WHERE user_id = $1',
        [guestId],
      );

      // Delete question stats
      await this.dataSource.query(
        'DELETE FROM user_question_stats WHERE user_id = $1',
        [guestId],
      );

      console.log('Guest user stats reset at midnight');
    } catch (error) {
      console.error('Failed to reset guest user stats:', error);
    }
  }

  private async getGuestUserId(): Promise<number> {
    const result = await this.dataSource.query(
      "SELECT id FROM users WHERE google_id = 'guest-user' LIMIT 1",
    );
    if (result.length === 0) {
      throw new Error('Guest user not found. Please run migrations.');
    }
    return result[0].id;
  }

  async initializeTable(tableName: string): Promise<{ message: string; success: boolean }> {
    this.logger.log(`Initializing table: ${tableName}`);

    try {
      const sqlFilePath = path.join(__dirname, '..', '..', '..', '..', 'scripts', 'sql', `${tableName}.sql`);

      if (!fs.existsSync(sqlFilePath)) {
        throw new Error(`SQL file not found for table: ${tableName}`);
      }

      const tableDbMap: Record<string, string> = {
        'users': 'auth',
        'questions': 'questions',
        'choices': 'questions',
        'achievements': 'achievements',
        'user_achievements': 'achievements',
        'leaderboards': 'leaderboard',
        'quiz_modes': 'quiz',
        'user_question_stats': 'quiz',
      };

      const targetDb = tableDbMap[tableName] || process.env.POSTGRES_DB || 'admin';

      const host = process.env.POSTGRES_HOST || 'postgres';
      const port = process.env.POSTGRES_PORT || '5432';
      const user = process.env.POSTGRES_USER || 'postgres';
      const password = process.env.POSTGRES_PASSWORD || 'postgres';

      const psqlCmd = `PGPASSWORD='${password}' psql -h ${host} -p ${port} -U ${user} -d ${targetDb} -f ${sqlFilePath}`;

      this.logger.debug(`Executing: ${psqlCmd}`);
      const output = execSync(psqlCmd, { encoding: 'utf8' });

      this.logger.log(`Table ${tableName} initialized successfully in ${targetDb} database`);
      this.logger.debug(`psql output: ${output}`);

      return {
        message: `Table ${tableName} initialized successfully in ${targetDb} database`,
        success: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error initializing table ${tableName}:`, error);
      throw new Error(`Failed to initialize table ${tableName}: ${message}`);
    }
  }

  async getTableStatus(): Promise<any[]> {
    const tableDbMap: Record<string, string> = {
      'users': 'auth',
      'questions': 'questions',
      'choices': 'questions',
      'achievements': 'achievements',
      'user_achievements': 'achievements',
      'leaderboards': 'leaderboard',
      'quiz_modes': 'quiz',
      'user_question_stats': 'quiz',
    };

    const tableNames = Object.keys(tableDbMap);
    const statuses = await Promise.all(
      tableNames.map(async (tableName) => {
        const dbName = tableDbMap[tableName];

        try {
          const client = new Client({
            host: process.env.POSTGRES_HOST || 'postgres',
            port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'postgres',
            database: dbName,
          });

          try {
            await client.connect();
            const result = await client.query(
              `SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = $1
              ) as exists`,
              [tableName],
            );

            return {
              name: tableName,
              database: dbName,
              exists: result.rows[0]?.exists || false,
            };
          } finally {
            await client.end();
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(`Error checking table ${tableName} in database ${dbName}:`, error);
          return {
            name: tableName,
            database: dbName,
            exists: false,
            error: message,
          };
        }
      }),
    );

    return statuses;
  }
}
