import { RegisterUserUseCase } from './register-user.use-case';
import { InMemoryUserRepository } from './__fakes__/in-memory-user.repository';
import { FakePasswordHasher } from './__fakes__/fake-password-hasher';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { ValidationError } from '../../../shared/domain/errors/validation.error';
import { Email } from '../../domain/value-objects/email.vo';

describe('RegisterUserUseCase', () => {
  let users: InMemoryUserRepository;
  let hasher: FakePasswordHasher;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    hasher = new FakePasswordHasher();
    useCase = new RegisterUserUseCase(users, hasher);
  });

  it('creates a new user with a hashed password', async () => {
    const result = await useCase.execute({
      email: 'alice@example.com',
      password: 'sup3rsecret',
    });

    expect(result.email).toBe('alice@example.com');
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    const stored = await users.findByEmail(Email.create('alice@example.com'));
    expect(stored).not.toBeNull();
    expect(stored!.passwordHash).toBe('hashed::sup3rsecret');
  });

  it('normalises the email to lowercase before storing', async () => {
    await useCase.execute({ email: 'Alice@Example.COM', password: 'sup3rsecret' });
    const stored = await users.findByEmail(Email.create('alice@example.com'));
    expect(stored).not.toBeNull();
  });

  it('rejects a duplicate email with UserAlreadyExistsError', async () => {
    await useCase.execute({ email: 'alice@example.com', password: 'sup3rsecret' });
    await expect(
      useCase.execute({ email: 'alice@example.com', password: 'anotherone' }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
    expect(users.size()).toBe(1);
  });

  it('rejects a malformed email with ValidationError', async () => {
    await expect(
      useCase.execute({ email: 'not-an-email', password: 'sup3rsecret' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a too-short password with ValidationError', async () => {
    await expect(
      useCase.execute({ email: 'alice@example.com', password: 'short' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
