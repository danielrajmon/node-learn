import { NestFactory, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { Express } from 'express';
import * as bodyParser from 'body-parser';
import { GatewayModule } from './gateway.module';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

@Module({
  imports: [GatewayModule],
})
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  app.use(CorrelationIdMiddleware);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 API Gateway running on port ${port}`);
  });
}

bootstrap();
