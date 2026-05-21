import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

/**
 * In-memory fake. Implements the same `UserRepository` interface as the
 * TypeORM adapter — proves LSP by passing the same contract.
 */
export class InMemoryUserRepository implements UserRepository {
  private readonly store = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.store.set(user.id.toString(), user);
  }

  async findById(id: Uuid): Promise<User | null> {
    return this.store.get(id.toString()) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email.equals(email)) return user;
    }
    return null;
  }

  size(): number {
    return this.store.size;
  }
}
