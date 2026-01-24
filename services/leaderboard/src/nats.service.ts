import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { connect, NatsConnection } from 'nats';

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
  private logger = new Logger('NatsService');

  async onModuleInit() {
    try {
      const natsUrl = requireEnv('NATS_URL');
      this.nc = await connect({ servers: natsUrl });
      this.logger.log(`Connected to NATS at ${natsUrl}`);

      // Subscribe to quiz events to update leaderboard
      this.subscribeToQuizEvents();
    } catch (error) {
      this.logger.error('Failed to connect to NATS:', error);
    }
  }

  private subscribeToQuizEvents() {
    // Subscribe to answer.submitted events from quiz service
    const sub = this.nc.subscribe('answer.submitted');
    this.logger.log('Subscribed to answer.submitted events');

    (async () => {
      for await (const msg of sub) {
        try {
          const event = JSON.parse(new TextDecoder().decode(msg.data));
          this.logger.debug(`Received quiz event: ${msg.subject}`, event);
          // Event is consumed by leaderboard update logic
          // Actual updates handled via POST /leaderboard/update endpoint
        } catch (error) {
          this.logger.error('Error processing NATS message:', error);
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
        serviceId: 'leaderboard',
      };
      this.nc.publish(eventType, new TextEncoder().encode(JSON.stringify(event)));
      this.logger.debug(`Published event: ${eventType}`, event);
    } catch (error) {
      this.logger.error('Error publishing event:', error);
    }
  }
}
