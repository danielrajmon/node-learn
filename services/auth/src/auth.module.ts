import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { NatsService } from './nats/nats.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DbService } from './db/db.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ session: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, NatsService, JwtStrategy, GoogleStrategy, JwtAuthGuard, DbService],
  exports: [AuthService],
})
export class AuthModule implements OnModuleInit {
  onModuleInit() {
    // Passport session serialization will be handled by NestJS PassportModule
    // with @UseGuards(AuthGuard('google')) decorator
  }
}

