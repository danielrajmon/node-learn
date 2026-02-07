import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@node-learn/messaging';
import { AnswerSubmittedPayload, DomainEvent, NATS_SUBJECTS } from '@node-learn/events';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class NatsSubscriberService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('NatsService');

  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly nats: NatsService,
  ) {}

  async onModuleInit() {
    try {
      await this.nats.connect();
      this.logger.log('Connected to NATS');

      // Subscribe to quiz events
      this.subscribeToQuizEvents();
    } catch (error) {
      this.logger.error('Failed to connect to NATS', error);
    }
  }

  async onModuleDestroy() {
    await this.nats.disconnect();
  }

  private subscribeToQuizEvents() {
    this.nats.subscribe(
      NATS_SUBJECTS.ANSWER_SUBMITTED,
      async (event: DomainEvent<AnswerSubmittedPayload>) => {
        try {
          const payload = event.payload;
          this.logger.debug(`Received event: ${event.type}`, payload);

          if (payload.userId && typeof payload.questionId === 'number') {
            const userId = Number(payload.userId);
            if (Number.isNaN(userId)) {
              this.logger.warn(`Skipping achievement check for invalid userId: ${payload.userId}`);
              return;
            }
            const isCorrect = payload.isCorrect === true;
            this.logger.log(
              `User ${userId} answered ${isCorrect ? 'correctly' : 'incorrectly'}: ${payload.questionId}`,
            );

            await this.achievementsService.recordAnswerProjection({
              userId: payload.userId,
              questionId: payload.questionId,
              isCorrect,
              questionType: payload.questionType,
              practical: payload.practical,
              difficulty: payload.difficulty,
            });

            const awarded = await this.achievementsService.checkAndAwardAchievements(
              userId,
              payload.questionId,
              isCorrect,
            );

            if (awarded.length > 0) {
              this.logger.log(
                `Awarded ${awarded.length} achievement(s) to user ${userId}:`,
                awarded.map((achievement) => achievement.title).join(', '),
              );

              for (const achievement of awarded) {
                await this.nats.publish(NATS_SUBJECTS.ACHIEVEMENT_UNLOCKED, {
                  userId,
                  achievementId: achievement.id,
                  achievementTitle: achievement.title,
                });
              }
            }
          }
        } catch (error) {
          this.logger.error('Error processing NATS message', error);
        }
      },
    );
  }
}
