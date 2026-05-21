import { PasswordHasher } from '../../ports/password-hasher.port';

export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed::${plain}`;
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed::${plain}`;
  }
}
