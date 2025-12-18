import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { RecordAnswerDto } from '../answer/dto/record-answer.dto';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { AchievementsService } from '../achievements/achievements.service';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(
    private readonly statsService: StatsService,
    private readonly achievementsService: AchievementsService,
  ) {}

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
  async recordAnswer(@Body() recordAnswerDto: RecordAnswerDto): Promise<{ success: boolean; awardedAchievements: any[] }> {
    await this.statsService.recordAnswer(
      recordAnswerDto.userId,
      recordAnswerDto.questionId,
      recordAnswerDto.isCorrect,
    );

    // Check and award achievements only if answer was correct
    let awardedAchievements: any[] = [];
    if (recordAnswerDto.isCorrect) {
      awardedAchievements = await this.achievementsService.checkAndAwardAchievements(
        recordAnswerDto.userId,
        recordAnswerDto.questionId,
        recordAnswerDto.isCorrect,
      );
    }

    return { success: true, awardedAchievements };
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Retrieve user performance statistics across all questions',
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'User statistics',
  })
  async getUserStats(
    @Param('userId') userId: string,
  ): Promise<any> {
    return this.statsService.getUserStats(+userId);
  }
}
