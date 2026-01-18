import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  
  // Enable CORS for API Gateway and services
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:80'],
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Auth Service listening on port ${port}`);
}

bootstrap();
