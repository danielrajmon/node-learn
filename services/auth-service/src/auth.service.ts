import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor() {
    console.log('AuthService initialized');
  }

  getHealth() {
    return {
      service: 'auth-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
