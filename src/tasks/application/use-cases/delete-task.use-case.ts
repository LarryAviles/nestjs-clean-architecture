import { TaskRepository } from '../../domain/repositories/task.repository';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { TaskNotFoundError } from '../../domain/errors/task-not-found.error';

export class DeleteTaskUseCase {
  constructor(private readonly tasks: TaskRepository) {}

  async execute(input: { userId: string; taskId: string }): Promise<void> {
    const userId = Uuid.create(input.userId);
    const taskId = Uuid.create(input.taskId);
    const task = await this.tasks.findById(taskId);
    if (!task || !task.isOwnedBy(userId)) {
      throw new TaskNotFoundError();
    }
    await this.tasks.delete(taskId);
  }
}
