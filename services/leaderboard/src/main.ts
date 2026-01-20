import { NestFactory } from '@nestjs/core';
import { LeaderboardModule } from './leaderboard.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(LeaderboardModule);
  
  const port = process.env.PORT || 3006;
  await app.listen(port);
  logger.log(`🏆 Leaderboard Service running on port ${port}`);
}
bootstrap();
