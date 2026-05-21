import { ValidationError } from '../../../shared/domain/errors/validation.error';

/**
 * Value Object: Password (plain-text, pre-hash).
 *
 * Why: enforces the password policy in the domain so the rule does not drift
 * into controllers. Hashing is a separate concern handled by the
 * `PasswordHasher` port — this VO only guarantees the input is policy-valid.
 */
export class Password {
  private static readonly MIN_LENGTH = 8;

  private constructor(private readonly value: string) {}

  static create(raw: string): Password {
    if (typeof raw !== 'string' || raw.length < Password.MIN_LENGTH) {
      throw new ValidationError(
        `Password must be at least ${Password.MIN_LENGTH} characters`,
      );
    }
    return new Password(raw);
  }

  toString(): string {
    return this.value;
  }
}
