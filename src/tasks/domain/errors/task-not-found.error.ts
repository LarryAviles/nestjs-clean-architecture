import { NotFoundError } from '../../../shared/domain/errors/not-found.error';

/**
 * Returned both when the id does not exist *and* when the task is owned by
 * another user. Leaking "exists but not yours" would let an attacker
 * enumerate task ids.
 */
export class TaskNotFoundError extends NotFoundError {
  constructor() {
    super('Task not found');
  }
}
