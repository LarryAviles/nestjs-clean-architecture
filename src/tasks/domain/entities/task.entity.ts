import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { ValidationError } from '../../../shared/domain/errors/validation.error';

/**
 * Task domain entity (POJO).
 *
 * Mutation methods (`rename`, `markCompleted`...) are absent on purpose:
 * scope is closed. Updates flow through `apply()` which validates every
 * change rather than letting the use case mutate fields ad hoc.
 */
export class Task {
  private constructor(
    public readonly id: Uuid,
    public readonly userId: Uuid,
    private _title: string,
    private _description: string | null,
    private _completed: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: {
    userId: Uuid;
    title: string;
    description?: string | null;
  }): Task {
    const title = Task.validateTitle(props.title);
    const description = Task.validateDescription(props.description ?? null);
    const now = new Date();
    return new Task(Uuid.generate(), props.userId, title, description, false, now, now);
  }

  static restore(props: {
    id: Uuid;
    userId: Uuid;
    title: string;
    description: string | null;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Task {
    return new Task(
      props.id,
      props.userId,
      props.title,
      props.description,
      props.completed,
      props.createdAt,
      props.updatedAt,
    );
  }

  get title(): string {
    return this._title;
  }

  get description(): string | null {
    return this._description;
  }

  get completed(): boolean {
    return this._completed;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  apply(changes: { title?: string; description?: string | null; completed?: boolean }): void {
    if (changes.title !== undefined) this._title = Task.validateTitle(changes.title);
    if (changes.description !== undefined)
      this._description = Task.validateDescription(changes.description);
    if (changes.completed !== undefined) this._completed = changes.completed;
    this._updatedAt = new Date();
  }

  isOwnedBy(userId: Uuid): boolean {
    return this.userId.equals(userId);
  }

  private static validateTitle(value: string): string {
    const trimmed = value?.trim();
    if (!trimmed) throw new ValidationError('Task title is required');
    if (trimmed.length > 200) throw new ValidationError('Task title is too long');
    return trimmed;
  }

  private static validateDescription(value: string | null): string | null {
    if (value === null) return null;
    if (value.length > 2000) throw new ValidationError('Task description is too long');
    return value;
  }
}
