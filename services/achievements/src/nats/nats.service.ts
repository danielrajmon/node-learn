import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { connect, NatsConnection } from 'nats';

@Injectable()
export class NatsService implements OnModuleInit {
  private nc: NatsConnection;
  private readonly logger = new Logger('NatsService');

  async onModuleInit() {
    try {
      const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
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
          if (event.userId && event.isCorrect) {
            // TODO: Implement achievement logic based on quiz performance
            // For now, just log the event
            this.logger.log(`User ${event.userId} answered correctly: ${event.questionId}`);
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
