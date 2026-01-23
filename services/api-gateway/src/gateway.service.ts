import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Gateway Service
 * Handles forwarding requests to backend services
 * Manages routing and response transformation
 */
@Injectable()
export class GatewayService {
  private logger = new Logger('GatewayService');
  private httpClient: AxiosInstance;

  private serviceUrls: Record<string, string> = {
    'auth': process.env.AUTH_SERVICE_URL || 'http://auth:3001',
    'questions':
      process.env.QUESTION_SERVICE_URL || 'http://questions:3002',
    'quiz': process.env.QUIZ_SERVICE_URL || 'http://quiz:3003',
    'achievements':
      process.env.ACHIEVEMENT_SERVICE_URL || 'http://achievements:3004',
    'leaderboard':
      process.env.LEADERBOARD_SERVICE_URL || 'http://leaderboard:3005',
    'admin': process.env.ADMIN_SERVICE_URL || 'http://admin:3007',
  };

  constructor() {
    this.httpClient = axios.create({
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status
      maxRedirects: 0, // Don't follow redirects - let client handle them
    });
  }

  /**
   * Forward request to target service
   * Preserves headers, body, and adds correlation tracking
   */
  async forwardRequest(
    req: Request,
    target: string,
    correlationId: string,
    isOAuth = false,
  ): Promise<{ status: number; headers: Record<string, any>; data: any }> {
    const serviceUrl = this.serviceUrls[target];

    if (!serviceUrl) {
      throw new Error(`Unknown service target: ${target}`);
    }

    // Handle path based on target service
    let path = req.path;
    // For microservices, strip the /api prefix from the path
    // (they handle their own routing without prefix)
    if (path.startsWith('/api')) {
      path = path.slice(4); // Remove '/api'
    }

    const url = `${serviceUrl}${path}`;
    const query = req.url.split('?')[1];
    const fullUrl = query ? `${url}?${query}` : url;

    const config: AxiosRequestConfig = {
      method: req.method as any,
      url: fullUrl,
      headers: this.prepareHeaders(req, correlationId, target),
      data: this.prepareBody(req),
    };

    this.logger.debug(`Forwarding [${correlationId}] ${req.method} ${fullUrl} → ${target}`);

    try {
      const response = await this.httpClient.request(config);

      this.logger.debug(
        `[${correlationId}] Response from ${target}: ${response.status}`,
      );

      return {
        status: response.status,
        headers: this.filterResponseHeaders(response.headers, isOAuth),
        data: response.data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[${correlationId}] Error forwarding to ${target}: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Prepare headers for forwarding
   * Keep important headers, add correlation ID, remove hop-by-hop headers
   */
  private prepareHeaders(
    req: Request,
    correlationId: string,
    target: string,
  ): Record<string, any> {
    const headers = {
      ...req.headers,
    };

    // Remove hop-by-hop headers
    delete headers['host'];
    delete headers['connection'];
    delete headers['content-length'];

    // Add/update correlation ID for tracing
    headers['x-correlation-id'] = correlationId;
    headers['x-forwarded-by'] = 'api-gateway';
    headers['x-forwarded-proto'] = req.protocol;

    return headers;
  }

  /**
   * Prepare request body
   */
  private prepareBody(req: Request): any {
    if (!req.body || Object.keys(req.body).length === 0) {
      return undefined;
    }
    return req.body;
  }

  /**
   * Filter response headers
   * Remove sensitive/hop-by-hop headers
   * For OAuth endpoints, remove restrictive CSP headers to allow Google OAuth page to work
   */
  private filterResponseHeaders(headers: Record<string, any>, isOAuth = false): Record<string, any> {
    const filtered = { ...headers };
    const removedHeaders = [
      'connection',
      'content-encoding',
      'content-length',
      'transfer-encoding',
      'keep-alive',
    ];

    removedHeaders.forEach((header) => {
      delete filtered[header];
    });

    // For OAuth endpoints, remove or relax CSP headers that prevent Google's OAuth page
    if (isOAuth) {
      delete filtered['content-security-policy'];
      delete filtered['content-security-policy-report-only'];
      delete filtered['x-content-security-policy'];
    }

    return filtered;
  }

  /**
   * Health check endpoint
   */
  async health(): Promise<{ status: string; services: Record<string, string> }> {
    const serviceHealth: Record<string, string> = {};

    for (const [serviceName, url] of Object.entries(this.serviceUrls)) {
      try {
        const response = await this.httpClient.get(`${url}/health`, {
          timeout: 5000,
        });
        serviceHealth[serviceName] =
          response.status === 200 ? 'healthy' : 'unhealthy';
      } catch {
        serviceHealth[serviceName] = 'unreachable';
      }
    }

    return {
      status: 'gateway-ok',
      services: serviceHealth,
    };
  }
}
