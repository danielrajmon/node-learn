import { Injectable } from '@nestjs/common';
import { QuestionService } from '../question/question.service';
import { AnswerResult } from './interfaces/answer.interface';

@Injectable()
export class AnswerService {
  constructor(private readonly questionService: QuestionService) {}

  checkAnswer(questionId: number, userAnswer: string): AnswerResult {
    const question = this.questionService.findOne(questionId);

    if (!question) {
      return {
        isCorrect: false,
        message: `Question with ID ${questionId} not found`,
        questionId,
        correctAnswer: '',
      };
    }

    const isCorrect = userAnswer.trim() === question.answer.trim();

    return {
      isCorrect,
      message: isCorrect
        ? 'Your answer is correct!'
        : 'Your answer is incorrect.',
      questionId,
      correctAnswer: question.answer,
    };
  }
}
