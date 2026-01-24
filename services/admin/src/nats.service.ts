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
export class NatsSubscriberService implements OnModuleInit {
  private nc: NatsConnection;
  private logger = new Logger('NatsSubscriberService');

  async onModuleInit() {
    try {
      const natsUrl = requireEnv('NATS_URL');
      this.nc = await connect({ servers: natsUrl });
      this.logger.log(`Connected to NATS at ${natsUrl}`);

      // Subscribe to user.login events to sync users
      this.subscribeToUserEvents();
    } catch (error) {
      this.logger.error('Failed to connect to NATS:', error);
    }
  }

  private subscribeToUserEvents() {
    const sub = this.nc.subscribe('user.login');
    this.logger.log('Subscribed to user.login events');

    (async () => {
      for await (const msg of sub) {
        try {
          const event = JSON.parse(new TextDecoder().decode(msg.data));
          this.logger.debug(`Received user.login event`, event);
          
          // Sync user to admin database
          await this.syncUser(event);
        } catch (error) {
          this.logger.error('Error processing user.login message:', error);
        }
      }
    })();
  }

  private async syncUser(event: any) {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      this.logger.log(`Received user.login event: ${JSON.stringify(event)}`);
      const { userId, googleId, email, name, isAdmin } = event.payload;
      this.logger.log(`Extracted: userId=${userId}, googleId=${googleId}, email=${email}, name=${name}, isAdmin=${isAdmin}`);
      
      await pool.query(
        `INSERT INTO users (id, google_id, email, name, is_admin)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE 
         SET google_id = EXCLUDED.google_id,
             email = EXCLUDED.email, 
             name = EXCLUDED.name,
             is_admin = EXCLUDED.is_admin,
             updated_at = CURRENT_TIMESTAMP`,
        [userId, googleId, email, name, isAdmin ?? false]
      );
      this.logger.log(`Synced user ${userId} to admin DB`);
    } catch (error) {
      this.logger.error('Error syncing user to admin DB:', error);
    } finally {
      await pool.end();
    }
  }
}
