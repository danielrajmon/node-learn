import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    this.logger.debug(`JWT Guard - Request path: ${request.path}`);
    this.logger.debug(`JWT Guard - Has auth header: ${!!request.headers.authorization}`);
    this.logger.debug(`JWT Guard - Token extracted: ${!!token}`);
    
    if (!token) {
      this.logger.warn('No token provided');
      throw new UnauthorizedException('No token provided');
    }

    try {
      const secret = process.env.JWT_SECRET || 'my-secret-key-change-in-production-12345';
      const payload = jwt.verify(token, secret);
      request.user = payload;
      this.logger.debug(`JWT Guard - User authenticated: ${JSON.stringify(payload)}`);
      return true;
    } catch (error) {
      this.logger.error(`JWT Guard - Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
