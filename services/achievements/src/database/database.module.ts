import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'postgres',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'interview_db',
      username: process.env.POSTGRES_USER || 'interview_user',
      password: process.env.POSTGRES_PASSWORD || 'password',
      entities: [],
      synchronize: false,
    }),
  ],
})
export class DatabaseModule {}
