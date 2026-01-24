import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { NatsService } from '../nats/nats.service';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: requireEnv('POSTGRES_HOST'),
      port: parseInt(requireEnv('POSTGRES_PORT'), 10),
      database: requireEnv('POSTGRES_DB'),
      username: requireEnv('POSTGRES_USER'),
      password: requireEnv('POSTGRES_PASSWORD'),
      entities: [],
      synchronize: false,
      logging: ['error'],
    }),
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService, NatsService],
})
export class AchievementsModule {}
