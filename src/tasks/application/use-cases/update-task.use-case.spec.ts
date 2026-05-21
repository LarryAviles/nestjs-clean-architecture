import { CreateTaskUseCase } from './create-task.use-case';
import { UpdateTaskUseCase } from './update-task.use-case';
import { DeleteTaskUseCase } from './delete-task.use-case';
import { ListTasksUseCase } from './list-tasks.use-case';
import { InMemoryTaskRepository } from './__fakes__/in-memory-task.repository';
import { TaskNotFoundError } from '../../domain/errors/task-not-found.error';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';

describe('Update / Delete / List task use cases', () => {
  let repo: InMemoryTaskRepository;
  let create: CreateTaskUseCase;
  let update: UpdateTaskUseCase;
  let remove: DeleteTaskUseCase;
  let list: ListTasksUseCase;

  const alice = Uuid.generate().toString();
  const bob = Uuid.generate().toString();

  beforeEach(() => {
    repo = new InMemoryTaskRepository();
    create = new CreateTaskUseCase(repo);
    update = new UpdateTaskUseCase(repo);
    remove = new DeleteTaskUseCase(repo);
    list = new ListTasksUseCase(repo);
  });

  it('updates only the supplied fields and bumps updatedAt', async () => {
    const created = await create.execute({ userId: alice, title: 'Old', description: 'd' });
    const before = created.updatedAt;
    await new Promise((r) => setTimeout(r, 5));

    const updated = await update.execute({
      userId: alice,
      taskId: created.id,
      title: 'New',
      completed: true,
    });

    expect(updated.title).toBe('New');
    expect(updated.description).toBe('d');
    expect(updated.completed).toBe(true);
    expect(updated.updatedAt.getTime()).toBeGreaterThan(before.getTime());
  });

  it('refuses to update another user\'s task', async () => {
    const created = await create.execute({ userId: alice, title: 'Mine' });
    await expect(
      update.execute({ userId: bob, taskId: created.id, title: 'Hax' }),
    ).rejects.toBeInstanceOf(TaskNotFoundError);
  });

  it('refuses to delete another user\'s task', async () => {
    const created = await create.execute({ userId: alice, title: 'Mine' });
    await expect(
      remove.execute({ userId: bob, taskId: created.id }),
    ).rejects.toBeInstanceOf(TaskNotFoundError);
    expect(repo.size()).toBe(1);
  });

  it('lists only the calling user\'s tasks', async () => {
    await create.execute({ userId: alice, title: 'A1' });
    await create.execute({ userId: alice, title: 'A2' });
    await create.execute({ userId: bob, title: 'B1' });

    const aliceTasks = await list.execute({ userId: alice });
    expect(aliceTasks).toHaveLength(2);
    expect(aliceTasks.every((t) => t.userId === alice)).toBe(true);
  });
});
