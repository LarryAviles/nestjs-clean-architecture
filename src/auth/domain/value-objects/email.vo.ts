import { ValidationError } from '../../../shared/domain/errors/validation.error';

/**
 * Value Object: Email.
 *
 * Why: keeps the "what makes a valid email" rule in one place. Use cases and
 * repositories accept `Email` instead of `string`, so an unvalidated email
 * can never reach the persistence layer.
 */
export class Email {
  private static readonly PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(private readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw?.trim().toLowerCase();
    if (!normalized || !Email.PATTERN.test(normalized)) {
      throw new ValidationError('Invalid email format');
    }
    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
