import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { connect, NatsConnection } from 'nats';
import { AchievementsService } from '../achievements/achievements.service';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

@Injectable()
export class NatsService implements OnModuleInit {
  private nc: NatsConnection;
  private readonly logger = new Logger('NatsService');

  constructor(private readonly achievementsService: AchievementsService) {}

  async onModuleInit() {
    try {
      const natsUrl = requireEnv('NATS_URL');
      this.nc = await connect({
        servers: natsUrl,
      });
      this.logger.log(`Connected to NATS at ${natsUrl}`);

      // Subscribe to quiz events
      this.subscribeToQuizEvents();
    } catch (error) {
      this.logger.error('Failed to connect to NATS', error);
    }
  }

  private subscribeToQuizEvents() {
    // Subscribe to answer.submitted events
    const sub = this.nc.subscribe('answer.submitted');
    (async () => {
      for await (const msg of sub) {
        try {
          const event = JSON.parse(new TextDecoder().decode(msg.data));
          this.logger.debug(`Received event: ${msg.subject}`, event);

          // Check for achievements based on the answer
          if (event.userId && typeof event.questionId === 'number') {
            const isCorrect = event.isCorrect === true;
            this.logger.log(`User ${event.userId} answered ${isCorrect ? 'correctly' : 'incorrectly'}: ${event.questionId}`);

            // Update local projection so we do not query other DBs
            await this.achievementsService.recordAnswerProjection({
              userId: event.userId,
              questionId: event.questionId,
              isCorrect,
              questionType: event.questionType,
              practical: event.practical,
              difficulty: event.difficulty,
            });
            
            // Check and award achievements using the projection
            const awarded = await this.achievementsService.checkAndAwardAchievements(
              event.userId,
              event.questionId,
              isCorrect,
            );
            
            if (awarded.length > 0) {
              this.logger.log(`Awarded ${awarded.length} achievement(s) to user ${event.userId}:`, 
                awarded.map(a => a.title).join(', '));
              
              // Publish achievement.unlocked events
              for (const achievement of awarded) {
                await this.publishEvent('achievement.unlocked', {
                  userId: event.userId,
                  achievementId: achievement.id,
                  achievementTitle: achievement.title,
                });
              }
            }
          }
        } catch (error) {
          this.logger.error('Error processing NATS message', error);
        }
      }
    })();
  }

  async publishEvent(eventType: string, payload: any) {
    if (!this.nc) {
      this.logger.warn('NATS not connected, skipping event publish');
      return;
    }
    try {
      const event = {
        ...payload,
        eventType,
        timestamp: new Date().toISOString(),
        serviceId: 'achievements',
      };
      this.nc.publish(eventType, new TextEncoder().encode(JSON.stringify(event)));
      this.logger.debug(`Published event: ${eventType}`, event);
    } catch (error) {
      this.logger.error('Error publishing event', error);
    }
  }
}
