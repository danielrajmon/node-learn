/**
 * NATS Service - Wrapper around NATS client
 * Used by all microservices for pub/sub communication
 */

import { Injectable, Logger } from '@nestjs/common';
import { connect, NatsConnection, Subscription } from 'nats';
import { v4 as uuid } from 'uuid';
import { DomainEvent, EventType, NATS_SUBJECTS } from '@node-learn/events';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

@Injectable()
export class NatsService {
  private nc: NatsConnection;
  private subscriptions: Map<string, Subscription> = new Map();
  private logger = new Logger('NatsService');

  async connect(natsUrl?: string) {
    if (this.nc) {
      return;
    }
    const resolved = natsUrl ?? process.env.NATS_URL;
    if (!resolved) {
      throw new Error('NATS_URL is required');
    }
    try {
      this.nc = await connect({
        servers: resolved,
      });
      this.logger.log(`Connected to NATS at ${resolved}`);
    } catch (error) {
      this.logger.error(`Failed to connect to NATS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Publish a domain event to NATS
   * Automatically adds metadata like timestamp, correlationId, etc.
   */
  async publish<T = any>(
    eventType: EventType,
    payload: T,
    correlationId?: string,
    causationId?: string,
  ): Promise<string> {
    if (!this.nc) {
      this.logger.warn(`NATS not connected, skipping publish for ${eventType}`);
      return '';
    }
    const eventId = uuid();
    const event: DomainEvent<T> = {
      id: eventId,
      type: eventType,
      aggregateId: payload['aggregateId'] || payload['userId'] || payload['questionId'] || 'unknown',
      aggregateType: this.inferAggregateType(eventType),
      payload,
      timestamp: new Date(),
      version: 1,
      correlationId: correlationId || uuid(),
      causationId,
      serviceId: process.env.SERVICE_ID || 'unknown',
    };

    const subject = NATS_SUBJECTS[eventType.toUpperCase().replace('.', '_')];

    if (!subject) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    try {
      await this.nc.publish(subject, JSON.stringify(event));
      this.logger.debug(`Published event: ${eventType} (${eventId})`);
      return eventId;
    } catch (error) {
      this.logger.error(`Failed to publish event ${eventType}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Subscribe to a specific event type
   * Handler is called when event is received
   */
  async subscribe(
    eventType: EventType,
    handler: (event: DomainEvent) => Promise<void> | void,
    subscriptionId?: string,
  ): Promise<string> {
    if (!this.nc) {
      this.logger.warn(`NATS not connected, cannot subscribe to ${eventType}`);
      return '';
    }
    const subject = NATS_SUBJECTS[eventType.toUpperCase().replace('.', '_')];

    if (!subject) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    const id = subscriptionId || `${eventType}-${uuid()}`;

    try {
      const subscription = this.nc.subscribe(subject);

      // Handle incoming messages asynchronously
      (async () => {
        for await (const msg of subscription) {
          try {
            const event = JSON.parse(new TextDecoder().decode(msg.data)) as DomainEvent;
            await Promise.resolve(handler(event));
          } catch (error) {
            this.logger.error(`Error handling event ${eventType}: ${error.message}`);
          }
        }
      })();

      this.subscriptions.set(id, subscription);
      this.logger.log(`Subscribed to ${eventType} (${id})`);
      return id;
    } catch (error) {
      this.logger.error(`Failed to subscribe to ${eventType}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Subscribe to multiple event types with the same handler
   */
  async subscribeToMultiple(
    eventTypes: EventType[],
    handler: (event: DomainEvent) => Promise<void> | void,
  ): Promise<string[]> {
    return Promise.all(
      eventTypes.map((eventType) => this.subscribe(eventType, handler)),
    );
  }

  /**
   * Unsubscribe from an event type
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      this.logger.log(`Unsubscribed from ${subscriptionId}`);
    }
  }

  /**
   * Infer aggregate type from event type
   */
  private inferAggregateType(eventType: EventType): string {
    if (eventType.startsWith('answer')) return 'answer';
    if (eventType.startsWith('achievement')) return 'achievement';
    if (eventType.startsWith('leaderboard')) return 'leaderboard';
    if (eventType.startsWith('question')) return 'question';
    if (eventType.startsWith('user')) return 'user';
    return 'unknown';
  }

  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    if (!this.nc) {
      return;
    }
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
    await this.nc.close();
    this.logger.log('Disconnected from NATS');
  }
}
