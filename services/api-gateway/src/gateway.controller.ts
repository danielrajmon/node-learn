import { Controller, All, Req, Res, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { GatewayService } from './gateway.service';

/**
 * API Gateway Controller
 * Routes all incoming requests to appropriate microservice or fallback to monolith
 * Uses strangler pattern to gradually migrate services
 */
@Controller()
export class GatewayController {
  private logger = new Logger('GatewayController');

  constructor(private gatewayService: GatewayService) {}

  /**
   * Catch-all route - route to appropriate service based on path
   */
  @All('*')
  async routeRequest(@Req() req: Request, @Res() res: Response): Promise<void> {
    const path = req.path;
    const method = req.method;
    const correlationId = req.headers['x-correlation-id'] || '';

    this.logger.debug(`[${correlationId}] ${method} ${path}`);

    // Add CORS headers to all responses
    const origin = (req.headers.origin as string) || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Correlation-ID');

    // Handle OPTIONS (preflight) requests
    if (method === 'OPTIONS') {
      res.status(204).send();
      return;
    }

    try {
      // Non-OAuth routes are forwarded through the gateway
      // (OAuth endpoints are routed directly via Ingress, bypassing gateway)

      // Determine which service to route to based on path
      const target = this.determineTarget(path, method);
      this.logger.debug(`[${correlationId}] Routing to: ${target}`);

      // Forward request to target service
      const response = await this.gatewayService.forwardRequest(
        req,
        target,
        correlationId as string,
      );

      // Return response
      res.status(response.status).set(response.headers).send(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${correlationId}] Error: ${errorMessage}`);
      res.status(500).json({ error: 'Internal Server Error', details: errorMessage });
    }
  }

  /**
   * Determine which service to route to based on the request path
   * Uses strangler pattern: new services first, fallback to monolith
   */
  private determineTarget(path: string, method: string): string {
    // Auth Service - all auth routes
    if (path.startsWith('/api/auth')) {
      return 'auth-service';
    }

    // Question Service - read-only endpoints (GET /questions)
    // NOTE: Until question-service is extracted, route to monolith
    if (path.startsWith('/api/questions') && method === 'GET') {
      return 'monolith'; // TODO: change to 'question-service' once extracted
    }

    // Stats/Answer Service - answer submission, stats
    // NOTE: Until quiz-service is extracted, route to monolith
    if (path.startsWith('/api/stats') || path.startsWith('/api/answer')) {
      return 'monolith'; // TODO: change to 'quiz-service' once extracted
    }

    // Achievements Service - read achievements
    // NOTE: Until achievement-service is extracted, route to monolith
    if (path.startsWith('/api/achievements')) {
      return 'monolith'; // TODO: change to 'achievement-service' once extracted
    }

    // Leaderboard Service
    // NOTE: Until leaderboard-service is extracted, route to monolith
    if (path.startsWith('/api/leaderboard')) {
      return 'monolith'; // TODO: change to 'leaderboard-service' once extracted
    }

    // Admin endpoints - all admin operations in monolith
    // NOTE: Until individual admin/service services are extracted
    if (path.startsWith('/api/admin')) {
      return 'monolith'; // TODO: split to specific services once extracted
    }

    // Default to monolith (fallback)
    return 'monolith';
  }
}
