import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { NatsModule } from '@node-learn/messaging';
import { NatsSubscriberService } from '../nats/nats.service';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url =
          config.get<string>('DATABASE_URL') ||
          `postgresql://${config.get('POSTGRES_USER')}:${config.get('POSTGRES_PASSWORD')}@${config.get('POSTGRES_HOST')}:${config.get('POSTGRES_PORT')}/${config.get('POSTGRES_DB')}`;

        return {
          type: 'postgres',
          url,
          entities: [],
          synchronize: false,
          logging: ['error'],
        };
      },
    }),
    NatsModule,
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService, NatsSubscriberService],
})
export class AchievementsModule {}
