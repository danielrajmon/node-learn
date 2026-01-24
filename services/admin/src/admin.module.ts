import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { QuestionEntity } from './entities/question.entity';
import { ChoiceEntity } from './entities/choice.entity';
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
    // Secondary connection: questions DB for QuestionEntity and ChoiceEntity
    TypeOrmModule.forRoot({
      name: 'questions',
      type: 'postgres',
      host: requireEnv('POSTGRES_HOST'),
      port: parseInt(requireEnv('POSTGRES_PORT'), 10),
      username: requireEnv('POSTGRES_USER'),
      password: requireEnv('POSTGRES_PASSWORD'),
      database: 'questions',
      entities: [QuestionEntity, ChoiceEntity],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([QuestionEntity, ChoiceEntity], 'questions'),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [requireEnv('NATS_URL')],
        },
      },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, NatsSubscriberService],
})
export class AdminModule {}
