import { config } from 'dotenv';
config({ path: '../.env' });

import { DataSource } from 'typeorm';
import { QuestionEntity } from '../question/entities/question.entity';
import * as fs from 'fs';
import * as path from 'path';

if (
  !process.env.POSTGRES_HOST ||
  !process.env.POSTGRES_USER ||
  !process.env.POSTGRES_PASSWORD ||
  !process.env.POSTGRES_DB
) {
  throw new Error('Missing one or more required environment variables for database connection.');
}

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [QuestionEntity],
  synchronize: false,
});

async function importQuestions() {
  await AppDataSource.initialize();
  const importPath = path.join(__dirname, '../seed/questions-export.json');
  const questions = JSON.parse(fs.readFileSync(importPath, 'utf-8'));

  await AppDataSource.getRepository(QuestionEntity).clear();
  await AppDataSource.query('ALTER SEQUENCE questions_id_seq RESTART WITH 1');
  await AppDataSource.getRepository(QuestionEntity).save(questions);
  await AppDataSource.destroy();
}

importQuestions().catch(console.error);