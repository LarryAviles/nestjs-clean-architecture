import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { PasswordHasher } from '../ports/password-hasher.port';
import { RegisterUserInput, RegisterUserOutput } from '../dtos/register-user.dto';

/**
 * Use Case: register a new user.
 *
 * SRP: one class, one operation, one `execute()` method. Depends only on
 * ports — no `@Injectable`, no `@Inject`. The Nest module wires concrete
 * adapters via `useFactory`, which is what lets these tests run without
 * booting the framework.
 */
export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const email = Email.create(input.email);
    const password = Password.create(input.password);

    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new UserAlreadyExistsError(email.toString());
    }

    const passwordHash = await this.hasher.hash(password.toString());
    const user = User.create({ email, passwordHash });
    await this.users.save(user);

    return { id: user.id.toString(), email: user.email.toString() };
  }
}
