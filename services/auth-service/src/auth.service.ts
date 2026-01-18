import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  isAdmin: boolean;
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    // JWT_SECRET configured
  }

  getHealth() {
    return {
      service: 'auth-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async validateOAuthUser(profile: {
    googleId: string;
    email: string;
    name: string;
    picture: string;
  }): Promise<User> {
    // TODO: Implement database lookup/creation in Phase 2
    // For now, return user object
    return {
      id: 1,
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async login(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        isAdmin: user.isAdmin,
      },
    };
  }

  async findById(id: number): Promise<User | null> {
    // TODO: Implement database lookup in Phase 2
    return null;
  }
}
