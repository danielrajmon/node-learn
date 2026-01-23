import { NestFactory } from '@nestjs/core';
import { AdminModule } from './admin.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AdminModule);
  
  const port = process.env.PORT || 3007;
  await app.listen(port);
  logger.log(`🔒 Admin Service running on port ${port}`);
}
bootstrap();
