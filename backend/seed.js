const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'node-learn-questions',
});

async function seed() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        topics TEXT[] NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table created');

    // Check if data already exists
    const { rows } = await client.query('SELECT COUNT(*) FROM questions');
    if (parseInt(rows[0].count) > 0) {
      console.log(`Database already has ${rows[0].count} questions. Skipping seed.`);
      await client.end();
      return;
    }

    // Load questions from JSON
    const questionsPath = path.join(__dirname, 'src/question/questions.json');
    const questionsData = fs.readFileSync(questionsPath, 'utf8');
    const questions = JSON.parse(questionsData);

    // Insert questions
    for (const q of questions) {
      await client.query(
        'INSERT INTO questions (question, answer, difficulty, topics) VALUES ($1, $2, $3, $4)',
        [q.question, q.answer, q.difficulty, q.topics]
      );
    }

    console.log(`✅ Seeded ${questions.length} questions successfully`);
    await client.end();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
