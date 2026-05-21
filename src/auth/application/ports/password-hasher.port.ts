/**
 * Port: PasswordHasher.
 *
 * Why ISP-tight: only `hash` and `compare`. Salt management or strength
 * checks belong elsewhere — keeping the interface narrow means a fake hasher
 * for tests is two lines, and swapping bcrypt for argon2 touches only the
 * adapter in `infrastructure/services/`.
 */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = 'PASSWORD_HASHER';
