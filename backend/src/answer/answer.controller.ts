import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AnswerService } from './answer.service';

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
}

