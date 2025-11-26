import { config } from 'dotenv';
config({ path: '../.env' });

import { DataSource } from 'typeorm';
import { QuestionEntity } from '../question/entities/question.entity';
import * as fs from 'fs';
import * as path from 'path';

if (
  !process.env.POSTGRES_HOST ||
  !process.env.POSTGRES_PORT ||
  !process.env.POSTGRES_DB ||
  !process.env.POSTGRES_USER ||
  !process.env.POSTGRES_PASSWORD
) {
  throw new Error('Missing one or more required environment variables for database connection.');
}

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  entities: [QuestionEntity],
  synchronize: false,
});

async function exportQuestions() {
  await AppDataSource.initialize();
  const questions = await AppDataSource.getRepository(QuestionEntity).find();
  const exportPath = path.join(__dirname, '../seed/questions-export.json');
  fs.writeFileSync(exportPath, JSON.stringify(questions, null, 2));
  await AppDataSource.destroy();
}

exportQuestions().catch(console.error);