import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';

/**
 * Correlation ID Middleware
 * Adds unique correlation ID to each request for end-to-end tracing
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private logger = new Logger('CorrelationIdMiddleware');

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] || uuid();

    // Attach to request for use in handlers
    req.headers['x-correlation-id'] = correlationId;

    // Log request
    this.logger.debug(
      `[${correlationId}] ${req.method} ${req.path} from ${req.ip}`,
    );

    // Attach correlation ID to response
    res.setHeader('x-correlation-id', correlationId);

    // Log response when finished
    res.on('finish', () => {
      this.logger.debug(`[${correlationId}] Response: ${res.statusCode}`);
    });

    next();
  }
}
