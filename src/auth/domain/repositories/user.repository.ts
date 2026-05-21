import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';

/**
 * Repository pattern.
 *
 * Why: the use cases need to persist and query users without coupling to
 * TypeORM. Both the production adapter and the in-memory test fake implement
 * this same interface — swapping persistence is a one-line module change.
 */
export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: Uuid): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';
