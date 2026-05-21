import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { UserRepository } from '../../domain/repositories/user.repository';

/**
 * Repository pattern (in-memory adapter).
 *
 * The port lives in `domain/repositories/user.repository.ts`; this Map-backed
 * class is one implementation. Use cases depend only on the interface, so
 * replacing this with a Postgres adapter requires zero changes to domain/ or
 * application/ — only a new class and a single `useClass` change in
 * auth.module.ts.
 *
 * All methods are async to keep the contract identical to a real data source.
 * Domain entities are stored directly — no ORM entity, no mapper needed here.
 */
@Injectable()
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
}
