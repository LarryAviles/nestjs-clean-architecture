import { LoginUserUseCase } from './login-user.use-case';
import { RegisterUserUseCase } from './register-user.use-case';
import { InMemoryUserRepository } from './__fakes__/in-memory-user.repository';
import { FakePasswordHasher } from './__fakes__/fake-password-hasher';
import { FakeTokenGenerator } from './__fakes__/fake-token-generator';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';

describe('LoginUserUseCase', () => {
  let users: InMemoryUserRepository;
  let hasher: FakePasswordHasher;
  let tokens: FakeTokenGenerator;
  let login: LoginUserUseCase;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    hasher = new FakePasswordHasher();
    tokens = new FakeTokenGenerator();
    login = new LoginUserUseCase(users, hasher, tokens);

    const register = new RegisterUserUseCase(users, hasher);
    await register.execute({ email: 'alice@example.com', password: 'sup3rsecret' });
  });

  it('returns an access token on valid credentials', async () => {
    const { accessToken } = await login.execute({
      email: 'alice@example.com',
      password: 'sup3rsecret',
    });
    expect(accessToken).toMatch(/^signed::.+::alice@example\.com$/);
  });

  it('rejects a wrong password with InvalidCredentialsError', async () => {
    await expect(
      login.execute({ email: 'alice@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects an unknown email with InvalidCredentialsError (no leak)', async () => {
    await expect(
      login.execute({ email: 'ghost@example.com', password: 'sup3rsecret' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('reports malformed email as InvalidCredentialsError (no enumeration)', async () => {
    await expect(
      login.execute({ email: 'not-an-email', password: 'sup3rsecret' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
