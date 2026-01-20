import { NestFactory } from '@nestjs/core';
import { AchievementsModule } from './achievements/achievements.module';

async function bootstrap() {
  const app = await NestFactory.create(AchievementsModule);

  // Enable CORS
  app.enableCors();

  const port = process.env.PORT || 3004;
  await app.listen(port);
  console.log(`Achievements Service listening on port ${port}`);
}
bootstrap();
