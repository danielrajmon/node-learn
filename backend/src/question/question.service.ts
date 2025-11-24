import { Injectable } from '@nestjs/common';
import { Question, QuestionFilters } from './interfaces/question.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class QuestionService {
  private questions: Question[];

  constructor() {
    const questionsPath = path.join(__dirname, 'questions.json');
    const questionsData = fs.readFileSync(questionsPath, 'utf8');
    this.questions = JSON.parse(questionsData);
  }

  findAll(filters?: QuestionFilters): Question[] {
    let result = [...this.questions];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (q) =>
          q.question.toLowerCase().includes(searchLower) ||
          q.answer.toLowerCase().includes(searchLower) ||
          q.topics.some((t) => t.toLowerCase().includes(searchLower)),
      );
    }

    if (filters?.difficulty) {
      result = result.filter((q) => q.difficulty === filters.difficulty);
    }

    if (filters?.topic) {
      const topicsToFilter = Array.isArray(filters.topic)
        ? filters.topic
        : [filters.topic];
      result = result.filter((q) =>
        topicsToFilter.some((topic) => q.topics.includes(topic)),
      );
    }

    return result;
  }

  findOne(id: number): Question | undefined {
    return this.questions.find((q) => q.id === id);
  }

  findRandom(): Question {
    const randomIndex = Math.floor(Math.random() * this.questions.length);
    return this.questions[randomIndex];
  }
}
