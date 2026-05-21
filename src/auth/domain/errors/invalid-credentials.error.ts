import { UnauthorizedError } from '../../../shared/domain/errors/unauthorized.error';

/**
 * Thrown for both "email not found" and "password mismatch" so the API
 * surface never reveals which one failed. The use case must not differentiate
 * between the two cases to a caller.
 */
export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Invalid credentials');
  }
}
