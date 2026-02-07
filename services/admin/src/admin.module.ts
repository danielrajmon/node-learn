import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NatsModule } from '@node-learn/messaging';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from './entities/user.entity';
import { NatsSubscriberService } from './nats.service';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

@Module({
  imports: [
    // Default connection: admin DB for User entity
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: requireEnv('POSTGRES_HOST'),
      port: parseInt(requireEnv('POSTGRES_PORT'), 10),
      username: requireEnv('POSTGRES_USER'),
      password: requireEnv('POSTGRES_PASSWORD'),
      database: requireEnv('POSTGRES_DB'),
      entities: [User],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([User]),
    NatsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, NatsSubscriberService],
})
export class AdminModule {}
