import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/infrastructure/auth.module';
import { TasksModule } from './tasks/infrastructure/tasks.module';
import { validateEnv } from './shared/infrastructure/config/env.config';
import { typeOrmConfig } from './shared/infrastructure/database/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync(typeOrmConfig),
    AuthModule,
    TasksModule,
  ],
})
export class AppModule {}
