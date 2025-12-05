import { Injectable } from '@nestjs/common';
import { QuestionService } from '../question/question.service';

@Injectable()
export class AnswerService {
  constructor(private readonly questionService: QuestionService) {}

  async getAnswer(questionId: number): Promise<{ questionId: number; answer: string; choices?: any[]; matchKeywords?: string[] } | null> {
    const question = await this.questionService.findOne(questionId);

    if (!question) {
      return null;
    }

    return {
      questionId,
      answer: question.answer || '',
      choices: question.choices || [],
      matchKeywords: question.matchKeywords || [],
    };
  }
}
