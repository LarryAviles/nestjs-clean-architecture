import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserOrmEntity } from './persistence/user.orm-entity';
import { TypeOrmUserRepository } from './persistence/typeorm-user.repository';
import { BcryptPasswordHasher } from './services/bcrypt-password-hasher';
import { JwtTokenGenerator } from './services/jwt-token-generator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { USER_REPOSITORY, UserRepository } from '../domain/repositories/user.repository';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../application/ports/password-hasher.port';
import {
  TOKEN_GENERATOR,
  TokenGenerator,
} from '../application/ports/token-generator.port';

import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { AuthController } from '../presentation/controllers/auth.controller';

/**
 * Composition root for the auth bounded context.
 *
 * This file is the *only* place that knows which concrete adapter implements
 * each port. Use cases receive interfaces through `useFactory`, not via
 * `@Inject` in their own files — that is what keeps `application/` framework
 * agnostic.
 *
 * Swapping bcrypt for argon2, or TypeORM for Prisma, is a change to this
 * module and the new adapter file. Nothing else.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // `@nestjs/jwt` types this as ms.StringValue; the runtime accepts
          // any string parseable by `ms`, so we forward whatever the env says.
          expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN') as unknown as number,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_GENERATOR, useClass: JwtTokenGenerator },

    {
      provide: RegisterUserUseCase,
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
      useFactory: (users: UserRepository, hasher: PasswordHasher) =>
        new RegisterUserUseCase(users, hasher),
    },
    {
      provide: LoginUserUseCase,
      inject: [USER_REPOSITORY, PASSWORD_HASHER, TOKEN_GENERATOR],
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        tokens: TokenGenerator,
      ) => new LoginUserUseCase(users, hasher, tokens),
    },

    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard, TOKEN_GENERATOR, USER_REPOSITORY],
})
export class AuthModule {}
