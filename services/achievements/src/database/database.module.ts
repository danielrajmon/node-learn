import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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
      database: requireEnv('POSTGRES_DB'),
      username: requireEnv('POSTGRES_USER'),
      password: requireEnv('POSTGRES_PASSWORD'),
      entities: [],
      synchronize: false,
    }),
  ],
})
export class DatabaseModule {}
