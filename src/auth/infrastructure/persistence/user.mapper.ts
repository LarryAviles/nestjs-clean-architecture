import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { UserOrmEntity } from './user.orm-entity';

/**
 * Mapper between the ORM row and the domain `User`.
 *
 * Why an explicit mapper: the domain entity has no TypeORM decorators by
 * rule. Without this seam, every repository method would do an ad-hoc
 * translation. Centralizing it here keeps the domain pure and the schema
 * free to evolve (e.g. snake_case columns, new audit fields) without
 * touching the domain at all.
 */
export class UserMapper {
  static toDomain(row: UserOrmEntity): User {
    return User.restore({
      id: Uuid.create(row.id),
      email: Email.create(row.email),
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
    });
  }

  static toOrm(user: User): UserOrmEntity {
    const row = new UserOrmEntity();
    row.id = user.id.toString();
    row.email = user.email.toString();
    row.passwordHash = user.passwordHash;
    row.createdAt = user.createdAt;
    return row;
  }
}
