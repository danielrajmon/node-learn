import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import session from 'express-session';
import passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  
  // Enable CORS for API Gateway, frontend, and services
  app.enableCors({
    origin: [
      'http://localhost:3000', 
      'http://localhost:4200',
      'http://localhost:80', 
      'http://localhost:3001',
      'https://huvinas.myqnapcloud.com:61510'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  });

  // Middleware to relax CSP for OAuth flows
  app.use((req, res, next) => {
    // Relax CSP for OAuth routes
    if (req.path.startsWith('/auth/google')) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://www.gstatic.com; frame-src https://accounts.google.com; connect-src 'self' https://accounts.google.com https://www.gstatic.com"
      );
    }
    next();
  });

  // Session middleware for Passport OAuth flow (before passport)
  app.use(
    session({
      secret: process.env.JWT_SECRET || 'session-secret-key',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false, httpOnly: true, sameSite: 'lax' },
    }),
  );

  // Passport middleware via express 
  app.use(passport.initialize());
  app.use(passport.session());

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Auth Service listening on port ${port}`);
}

bootstrap();
