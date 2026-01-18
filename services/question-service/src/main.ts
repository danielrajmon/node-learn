import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'log', 'warn'],
  });

  const logger = new Logger('Bootstrap');

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:3000',
      'http://api-gateway:3000',
      'https://huvinas.myqnapcloud.com:61510',
    ],
    credentials: true,
  });

  const port = process.env.PORT || 3002;
  await app.listen(port);

  logger.log(`✓ Question Service listening on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start Question Service:', err);
  process.exit(1);
});
