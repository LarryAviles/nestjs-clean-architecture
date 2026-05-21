/**
 * Base class for all domain/application errors.
 *
 * Why a custom hierarchy: throwing plain `Error` forces every caller (or the
 * exception filter) to string-match messages. Subclassing gives us a typed
 * surface that the global filter maps to HTTP codes, while keeping the domain
 * layer agnostic of HTTP itself.
 */
export abstract class DomainError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
