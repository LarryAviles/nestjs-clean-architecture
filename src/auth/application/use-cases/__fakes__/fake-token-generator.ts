import {
  TokenGenerator,
  TokenPayload,
} from '../../ports/token-generator.port';

export class FakeTokenGenerator implements TokenGenerator {
  async sign(payload: TokenPayload): Promise<string> {
    return `signed::${payload.sub}::${payload.email}`;
  }

  async verify(token: string): Promise<TokenPayload> {
    const [, sub, email] = token.split('::');
    if (!sub || !email) throw new Error('bad token');
    return { sub, email };
  }
}
