import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { connect, NatsConnection, JSONCodec } from 'nats';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger('NatsService');
  private nc: NatsConnection;
  private codec = JSONCodec();

  async onModuleInit() {
    try {
      const natsUrl = requireEnv('NATS_URL');
      this.nc = await connect({
        servers: natsUrl,
        name: 'quiz-service',
        maxReconnectAttempts: -1,
        reconnectTimeWait: 1000,
      });

      this.logger.log(`Connected to NATS at ${natsUrl}`);

      // Handle connection events
      (async () => {
        for await (const status of this.nc.status()) {
          this.logger.debug(`NATS status: ${status.type}`);
        }
      })();
    } catch (error) {
      this.logger.error(`Failed to connect to NATS: ${error.message}`);
      this.logger.warn('Quiz service will continue without NATS event publishing');
    }
  }

  async onModuleDestroy() {
    if (this.nc) {
      await this.nc.drain();
      this.logger.log('Disconnected from NATS');
    }
  }

  /**
   * Publish event to NATS
   */
  async publish(subject: string, data: any): Promise<void> {
    if (!this.nc) {
      this.logger.warn(`NATS not connected, skipping publish to ${subject}`);
      return;
    }

    try {
      const payload = this.codec.encode(data);
      this.nc.publish(subject, payload);
      this.logger.debug(`Published event: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to publish to ${subject}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Subscribe to NATS subject (for future use in saga compensation)
   */
  async subscribe(subject: string, callback: (data: any) => void) {
    if (!this.nc) {
      this.logger.warn(`NATS not connected, cannot subscribe to ${subject}`);
      return;
    }

    const sub = this.nc.subscribe(subject);
    this.logger.log(`Subscribed to ${subject}`);

    (async () => {
      for await (const msg of sub) {
        try {
          const data = this.codec.decode(msg.data);
          callback(data);
        } catch (error) {
          this.logger.error(`Error processing message from ${subject}: ${error.message}`);
        }
      }
    })();
  }
}
