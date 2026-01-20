import { Injectable, Logger } from '@nestjs/common';
import { connect, NatsConnection, JSONCodec } from 'nats';

@Injectable()
export class NatsService {
  private nc: NatsConnection;
  private codec = JSONCodec();
  private logger = new Logger('NatsService');

  async onModuleInit() {
    try {
      const natsUrl = process.env.NATS_URL || 'nats://nats:4222';
      this.nc = await connect({ servers: natsUrl });
      this.logger.log(`Connected to NATS at ${natsUrl}`);

      // Subscribe to leaderboard update events
      this.subscribeToLeaderboardUpdates();
    } catch (error) {
      this.logger.error('Failed to connect to NATS:', error);
    }
  }

  private async subscribeToLeaderboardUpdates() {
    const sub = this.nc.subscribe('leaderboard.update');
    this.logger.log('Subscribed to leaderboard.update');

    for await (const msg of sub) {
      try {
        const data = this.codec.decode(msg.data) as any;
        this.logger.debug(`Received leaderboard.update event:`, data);
        // Event will be handled by the controller
      } catch (error) {
        this.logger.error('Error processing leaderboard.update:', error);
      }
    }
  }

  async publish(subject: string, data: any) {
    this.nc.publish(subject, this.codec.encode(data));
  }
}
