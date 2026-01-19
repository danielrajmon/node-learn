import { NestFactory } from '@nestjs/core';
import { QuizModule } from './quiz.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('QuizService');
  const app = await NestFactory.create(QuizModule);

  const port = process.env.PORT || 3003;
  await app.listen(port);
  
  logger.log(`🎯 Quiz Service running on port ${port}`);
}

bootstrap();
