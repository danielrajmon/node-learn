import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnswerService } from './answer.service';
import { SubmitAnswerDto, AnswerResultDto } from './dto/answer.dto';
import type { AnswerResult } from './interfaces/answer.interface';

@ApiTags('answers')
@Controller('answers')
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Post(':questionId')
  @ApiOperation({
    summary: 'Submit an answer',
    description: 'Check if the submitted answer matches the correct answer',
  })
  @ApiResponse({
    status: 200,
    description: 'Answer result',
    type: AnswerResultDto,
  })
  submitAnswer(
    @Param('questionId') questionId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
  ): AnswerResult {
    return this.answerService.checkAnswer(
      +questionId,
      submitAnswerDto.answer,
    );
  }
}
