import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { Email } from '../value-objects/email.vo';

/**
 * User domain entity (POJO).
 *
 * No `@Entity`, no `@Column`, no `@Injectable`. The persistence layer keeps
 * its own ORM entity and a mapper bridges the two. This is what keeps the
 * domain testable without booting Nest or Postgres.
 */
export class User {
  private constructor(
    public readonly id: Uuid,
    public readonly email: Email,
    public readonly passwordHash: string,
    public readonly createdAt: Date,
  ) {}

  static create(props: { email: Email; passwordHash: string }): User {
    return new User(Uuid.generate(), props.email, props.passwordHash, new Date());
  }

  static restore(props: {
    id: Uuid;
    email: Email;
    passwordHash: string;
    createdAt: Date;
  }): User {
    return new User(props.id, props.email, props.passwordHash, props.createdAt);
  }
}
