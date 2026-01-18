import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import session from 'express-session';
import passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  
  // Enable CORS for API Gateway and services
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:80', 'https://huvinas.myqnapcloud.com:61510'],
    credentials: true,
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
