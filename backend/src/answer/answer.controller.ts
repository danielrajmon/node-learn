import { Controller, Get, Post, Param, Body, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AnswerService } from './answer.service';
import { RecordAnswerDto } from './dto/record-answer.dto';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';

@ApiTags('answers')
@Controller('answers')
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Get(':questionId')
  @ApiOperation({
    summary: 'Get answer for a question',
    description: 'Retrieve the correct answer and explanation for a question',
  })
  @ApiParam({ name: 'questionId', description: 'Question ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'The answer with explanation',
    schema: {
      type: 'object',
      properties: {
        questionId: { type: 'number' },
        answer: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async getAnswer(
    @Param('questionId') questionId: string,
  ): Promise<{ questionId: number; answer: string }> {
    const result = await this.answerService.getAnswer(+questionId);
    if (!result) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }
    return result;
  }

  @Post('record')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({
    summary: 'Record a quiz answer',
    description: 'Record whether the user answered a question correctly or incorrectly',
  })
  @ApiResponse({
    status: 201,
    description: 'Answer recorded successfully',
  })
  async recordAnswer(@Body() recordAnswerDto: RecordAnswerDto): Promise<{ success: boolean }> {
    await this.answerService.recordAnswer(
      recordAnswerDto.userId,
      recordAnswerDto.questionId,
      recordAnswerDto.isCorrect,
    );
    return { success: true };
  }
}

