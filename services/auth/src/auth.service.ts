import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NatsService } from './nats/nats.service';
import { User } from './entities/user.entity';
import { DbService } from './db/db.service';

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  isAdmin: boolean;
}

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private natsService: NatsService,
    private db: DbService,
  ) {}

  async onModuleInit() {
    // Connect to NATS on service startup
    try {
      await this.natsService.connect(process.env.NATS_URL);
    } catch (error) {
      console.error('Failed to connect to NATS:', error);
    }
  }

  async onModuleDestroy() {
    // Disconnect from NATS on service shutdown
    await this.natsService.disconnect();
  }

  getHealth() {
    return {
      service: 'auth',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async validateOAuthUser(profile: {
    googleId: string;
    email: string;
    name: string;
    picture?: string | null;
  }): Promise<User> {
    // Look up by Google ID first
    let row = await this.db.findUserByGoogleId(profile.googleId);

    // If not found, try by email and backfill google_id if needed
    if (!row) {
      const byEmail = await this.db.findUserByEmail(profile.email);
      if (byEmail) {
        await this.db.updateGoogleIdIfMissing(byEmail.id, profile.googleId);
        row = { ...byEmail, google_id: profile.googleId } as any;
      }
    }

    // If still not found, create new user
    if (!row) {
      row = await this.db.createUser({
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        picture: profile.picture ?? null,
      });
    }

    const user: User = {
      id: row.id,
      googleId: row.google_id,
      email: row.email,
      name: row.name,
      isAdmin: row.is_admin,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    // Publish user.login event to NATS
    await this.natsService.publish('user.login', {
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: 'google',
    });

    return user;
  }

  async login(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    };

    const access_token = this.jwtService.sign(payload);

    // Publish user.login event
    await this.natsService.publish('user.login', {
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    };
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.db.findUserById(id);
    if (!row) return null;
    return {
      id: row.id,
      googleId: row.google_id,
      email: row.email,
      name: row.name,
      isAdmin: row.is_admin,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
