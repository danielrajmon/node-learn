import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Node-Learn API Gateway')
    .setDescription('OpenAPI documentation for the API Gateway and routed services.')
    .setVersion('1.0')
    .build();

  const openapiPathCandidates = [
    process.env.OPENAPI_PATH,
    path.resolve(process.cwd(), 'openapi.yaml'),
    path.resolve(process.cwd(), '..', '..', 'openapi.yaml'),
  ].filter(Boolean) as string[];

  let swaggerDocument: any;
  const openapiPath = openapiPathCandidates.find((candidate) => fs.existsSync(candidate));
  if (openapiPath) {
    const openapiYaml = fs.readFileSync(openapiPath, 'utf8');
    swaggerDocument = parseYaml(openapiYaml);
  } else {
    swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  }

  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 API Gateway running on port ${port}`);
  });
}

bootstrap();
