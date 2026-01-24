import { NestFactory } from '@nestjs/core';
import { AdminModule } from './admin.module';
import { Logger } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AdminModule);
  
  // Increase payload limit for question imports
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  
  const port = process.env.PORT || 3007;
  await app.listen(port);
  logger.log(`🔒 Admin Service running on port ${port}`);
}
bootstrap();
