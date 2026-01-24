import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { NatsService } from './nats.service';
import { LeaderboardEntity } from './entities/leaderboard.entity';
import { UserEntity } from './entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const requireEnv = (key: string): string => {
          const value = configService.get<string>(key);
          if (!value) {
            throw new Error(`${key} is required`);
          }
          return value;
        };

        const databaseUrl = configService.get<string>('DATABASE_URL') ??
          `postgresql://${requireEnv('POSTGRES_USER')}:${requireEnv('POSTGRES_PASSWORD')}@${requireEnv('POSTGRES_HOST')}:${requireEnv('POSTGRES_PORT')}/${requireEnv('POSTGRES_DB')}`;
        
        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [LeaderboardEntity, UserEntity],
          synchronize: false,
          logging: false,
        };
      },
    }),
    TypeOrmModule.forFeature([LeaderboardEntity, UserEntity]),
  ],
  controllers: [LeaderboardController],
  providers: [NatsService, LeaderboardService],
  exports: [NatsService, LeaderboardService],
})
export class LeaderboardModule {}
