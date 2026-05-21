import { Email } from '../../domain/value-objects/email.vo';
import { UserRepository } from '../../domain/repositories/user.repository';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { PasswordHasher } from '../ports/password-hasher.port';
import { TokenGenerator } from '../ports/token-generator.port';
import { LoginUserInput, LoginUserOutput } from '../dtos/login-user.dto';
import { ValidationError } from '../../../shared/domain/errors/validation.error';

export class LoginUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenGenerator,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    /**
     * Malformed email is reported as InvalidCredentials, not ValidationError,
     * so the caller cannot use the error type to infer that "no user with
     * this email shape could exist".
     */
    let email: Email;
    try {
      email = Email.create(input.email);
    } catch (err) {
      if (err instanceof ValidationError) throw new InvalidCredentialsError();
      throw err;
    }

    const user = await this.users.findByEmail(email);
    if (!user) throw new InvalidCredentialsError();

    const ok = await this.hasher.compare(input.password ?? '', user.passwordHash);
    if (!ok) throw new InvalidCredentialsError();

    const accessToken = await this.tokens.sign({
      sub: user.id.toString(),
      email: user.email.toString(),
    });

    return { accessToken };
  }
}
