import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@node-learn/messaging';
import { DomainEvent, NATS_SUBJECTS, UserLoginPayload } from '@node-learn/events';

@Injectable()
export class NatsSubscriberService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger('NatsSubscriberService');

  constructor(private readonly nats: NatsService) {}

  async onModuleInit() {
    try {
      await this.nats.connect();
      this.logger.log('Connected to NATS');

      // Subscribe to user.login events to sync users
      this.subscribeToUserEvents();
    } catch (error) {
      this.logger.error('Failed to connect to NATS:', error);
    }
  }

  async onModuleDestroy() {
    await this.nats.disconnect();
  }

  private subscribeToUserEvents() {
    this.nats.subscribe(NATS_SUBJECTS.USER_LOGIN, async (event: DomainEvent<UserLoginPayload>) => {
      try {
        this.logger.debug('Received user.login event', event);

        // Sync user to admin database
        await this.syncUser(event);
      } catch (error) {
        this.logger.error('Error processing user.login message:', error);
      }
    });
    this.logger.log('Subscribed to user.login events');
  }

  private async syncUser(event: DomainEvent<UserLoginPayload>) {
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
