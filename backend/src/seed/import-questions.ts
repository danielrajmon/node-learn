import { DataSource } from 'typeorm';
import { QuestionEntity } from '../question/entities/question.entity';
import * as fs from 'fs';
import * as path from 'path';

const envPath = '../.env';
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

if (
  !process.env.POSTGRES_HOST ||
  !process.env.POSTGRES_PORT ||
  !process.env.POSTGRES_DB ||
  !process.env.POSTGRES_USER ||
  !process.env.POSTGRES_PASSWORD
) {
  throw new Error(
    `Missing one or more required environment variables for database connection.
    POSTGRES_HOST: ${process.env.POSTGRES_HOST}
    POSTGRES_PORT: ${process.env.POSTGRES_PORT}
    POSTGRES_DB: ${process.env.POSTGRES_DB}
    POSTGRES_USER: ${process.env.POSTGRES_USER}
    POSTGRES_PASSWORD: ${process.env.POSTGRES_PASSWORD}`
  );
}

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  entities: [QuestionEntity],
  synchronize: true,
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