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
        const databaseUrl = configService.get('DATABASE_URL') || 
          `postgresql://${configService.get('POSTGRES_USER')}:${configService.get('POSTGRES_PASSWORD')}@${configService.get('POSTGRES_HOST')}:${configService.get('POSTGRES_PORT')}/${configService.get('POSTGRES_DB')}`;
        
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
  providers: [LeaderboardService, NatsService],
})
export class LeaderboardModule {}
