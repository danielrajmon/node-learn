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

    try {
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
      this.logger.error(`[${correlationId}] Error: ${error.message}`);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
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
    if (path.startsWith('/api/questions') && method === 'GET') {
      return 'question-service';
    }

    // Admin endpoints - question CRUD still in monolith
    if (path.startsWith('/api/admin/questions')) {
      return 'monolith';
    }

    // Quiz/Stats Service - answer submission, stats
    if (path.startsWith('/api/stats') || path.startsWith('/api/answer')) {
      return 'quiz-service';
    }

    // Achievements Service - read achievements
    if (path.startsWith('/api/achievements') && method === 'GET') {
      return 'achievement-service';
    }

    // Leaderboard Service
    if (path.startsWith('/api/leaderboard')) {
      return 'leaderboard-service';
    }

    // Admin Service (for future use)
    if (path.startsWith('/api/admin')) {
      return 'admin-service';
    }

    // Default to monolith (fallback)
    return 'monolith';
  }
}
