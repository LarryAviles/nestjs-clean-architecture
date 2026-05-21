/**
 * Port: TokenGenerator.
 *
 * Why: the use case wants "give me an access token for this user id", not
 * the details of which library signs it. JWT today, opaque session tomorrow —
 * only the adapter changes.
 */
export interface TokenPayload {
  sub: string;
  email: string;
}

export interface TokenGenerator {
  sign(payload: TokenPayload): Promise<string>;
  verify(token: string): Promise<TokenPayload>;
}

export const TOKEN_GENERATOR = 'TOKEN_GENERATOR';
