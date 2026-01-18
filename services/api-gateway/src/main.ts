import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { Express } from 'express';
import * as bodyParser from 'body-parser';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  // Enable CORS for all origins in development
  // This allows the frontend (port 4200) to call the API Gateway (port 3000)
  app.enableCors({
    origin: true, // Allow all origins (adjust for production)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  });

  // Middleware
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 API Gateway running on port ${port}`);
  });
}

bootstrap();
