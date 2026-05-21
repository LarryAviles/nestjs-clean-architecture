import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { InMemoryUserRepository } from './persistence/in-memory-user.repository';
import { BcryptPasswordHasher } from './services/bcrypt-password-hasher';
import { JwtTokenGenerator } from './services/jwt-token-generator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { USER_REPOSITORY, UserRepository } from '../domain/repositories/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../application/ports/password-hasher.port';
import { TOKEN_GENERATOR, TokenGenerator } from '../application/ports/token-generator.port';

import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { AuthController } from '../presentation/controllers/auth.controller';

/**
 * Composition root for the auth bounded context.
 *
 * This is the only file that knows which concrete adapter backs each port.
 * To swap bcrypt for argon2, or the in-memory store for Postgres:
 * add the new adapter class and change the relevant `useClass` binding here.
 * Nothing in domain/ or application/ changes.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN') as unknown as number,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Change useClass here to swap to a DB-backed adapter
    { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
    // Change useClass here to swap to argon2 or any other hasher
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
