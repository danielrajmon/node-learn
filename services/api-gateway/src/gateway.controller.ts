import { Controller, All, Req, Res, Logger, Get } from '@nestjs/common';
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
   * Health check endpoint for K8s liveness/readiness probes
   */
  @Get('health')
  health() {
    return { status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() };
  }

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

    // Remove restrictive CSP headers for OAuth routes (let auth service handle it)
    if (path.includes('/auth/google')) {
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('Content-Security-Policy-Report-Only');
      res.removeHeader('X-Content-Security-Policy');
    }

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
      const isOAuth = path.includes('/auth/google');
      const response = await this.gatewayService.forwardRequest(
        req,
        target,
        correlationId as string,
        isOAuth,
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
   *
   * NOTE: In K8s, Traefik strips /api prefix before routing to gateway.
   * In Docker Compose, requests come with /api prefix directly.
   * This function handles both cases.
   */
  private determineTarget(path: string, method: string): string {
    // Normalize path - remove /api if present for consistent routing logic
    const normalizedPath = path.startsWith('/api') ? path.slice(4) : path;

    // Auth Service - all auth routes
    // (Auth is routed directly by Traefik in K8s and doesn't reach gateway)
    if (normalizedPath.startsWith('/auth')) {
      return 'auth';
    }

    // Questions Service - read-only endpoints (GET /questions)
    if (normalizedPath.startsWith('/questions') && method === 'GET') {
      return 'questions';
    }

    // Quiz Service - quiz modes, answer submission and stats
    if (normalizedPath.startsWith('/quiz')) {
      return 'quiz';
    }
    // Answer endpoints go to quiz service
    if (normalizedPath.startsWith('/answers')) {
      return 'quiz';
    }
    if (normalizedPath.startsWith('/answer') && method === 'POST') {
      return 'quiz';
    }
    // All stats endpoints now go to quiz service
    if (normalizedPath.startsWith('/stats')) {
      return 'quiz';
    }

    // Achievements Service - read achievements
    if (normalizedPath.startsWith('/achievements')) {
      return 'achievements';
    }

    // Leaderboard Service
    if (normalizedPath.startsWith('/leaderboard')) {
      return 'leaderboard';
    }

    // Admin Service - admin operations (question CRUD, user management)
    if (normalizedPath.startsWith('/admin')) {
      return 'admin';
    }

    // Default to monolith (fallback)
    return 'monolith';
  }
}
