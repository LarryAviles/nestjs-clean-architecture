import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  TokenGenerator,
  TokenPayload,
} from '../../application/ports/token-generator.port';
import { UnauthorizedError } from '../../../shared/domain/errors/unauthorized.error';

@Injectable()
export class JwtTokenGenerator implements TokenGenerator {
  constructor(private readonly jwt: JwtService) {}

  sign(payload: TokenPayload): Promise<string> {
    return this.jwt.signAsync(payload);
  }

  async verify(token: string): Promise<TokenPayload> {
    try {
      const decoded = await this.jwt.verifyAsync<TokenPayload>(token);
      if (typeof decoded?.sub !== 'string' || typeof decoded?.email !== 'string') {
        throw new UnauthorizedError('Malformed token');
      }
      return { sub: decoded.sub, email: decoded.email };
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
