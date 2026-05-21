import { randomUUID } from 'crypto';
import { ValidationError } from '../errors/validation.error';

/**
 * Value Object: Uuid.
 *
 * Why: passing raw strings around lets any string masquerade as an id.
 * Wrapping it makes invalid ids unrepresentable past the constructor and
 * gives the type system something to anchor on.
 */
export class Uuid {
  private static readonly PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private constructor(private readonly value: string) {}

  static create(value: string): Uuid {
    if (!Uuid.PATTERN.test(value)) {
      throw new ValidationError(`Invalid uuid: ${value}`);
    }
    return new Uuid(value);
  }

  static generate(): Uuid {
    return new Uuid(randomUUID());
  }

  toString(): string {
    return this.value;
  }

  equals(other: Uuid): boolean {
    return this.value === other.value;
  }
}
