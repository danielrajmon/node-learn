import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Node.js Interview Questions API')
    .setDescription('API for managing and retrieving Node.js interview questions')
    .setVersion('1.0')
    .addTag('questions')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use(morgan('combined')); // Logs all requests

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
