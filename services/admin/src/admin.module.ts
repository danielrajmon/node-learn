import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { QuestionEntity } from './entities/question.entity';
import { ChoiceEntity } from './entities/choice.entity';
import { User } from './entities/user.entity';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: requireEnv('POSTGRES_HOST'),
      port: parseInt(requireEnv('POSTGRES_PORT'), 10),
      username: requireEnv('POSTGRES_USER'),
      password: requireEnv('POSTGRES_PASSWORD'),
      database: requireEnv('POSTGRES_DB'),
      entities: [QuestionEntity, ChoiceEntity, User],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([QuestionEntity, ChoiceEntity, User]),
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
  providers: [AdminService],
})
export class AdminModule {}
