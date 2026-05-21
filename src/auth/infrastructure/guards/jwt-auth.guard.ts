import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import {
  TOKEN_GENERATOR,
  TokenGenerator,
  TokenPayload,
} from '../../application/ports/token-generator.port';
import { UnauthorizedError } from '../../../shared/domain/errors/unauthorized.error';

export interface AuthenticatedRequest extends Request {
  user: TokenPayload;
}

/**
 * Verifies a bearer JWT and attaches the payload to `request.user`.
 *
 * We deliberately use `@nestjs/jwt` via the TokenGenerator port instead of
 * Passport. Less magic, and the guard can be tested by injecting a fake
 * generator.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_GENERATOR) private readonly tokens: TokenGenerator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedError('Missing bearer token');
    }

    request.user = await this.tokens.verify(token);
    return true;
  }
}
