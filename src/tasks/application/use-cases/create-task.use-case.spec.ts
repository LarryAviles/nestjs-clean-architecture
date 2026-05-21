import { CreateTaskUseCase } from './create-task.use-case';
import { GetTaskUseCase } from './get-task.use-case';
import { InMemoryTaskRepository } from './__fakes__/in-memory-task.repository';
import { TaskNotFoundError } from '../../domain/errors/task-not-found.error';
import { ValidationError } from '../../../shared/domain/errors/validation.error';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';

describe('CreateTaskUseCase + ownership rule', () => {
  let repo: InMemoryTaskRepository;
  let create: CreateTaskUseCase;
  let get: GetTaskUseCase;

  const alice = Uuid.generate().toString();
  const bob = Uuid.generate().toString();

  beforeEach(() => {
    repo = new InMemoryTaskRepository();
    create = new CreateTaskUseCase(repo);
    get = new GetTaskUseCase(repo);
  });

  it('creates a task scoped to the calling user', async () => {
    const task = await create.execute({
      userId: alice,
      title: 'Buy milk',
      description: '2L',
    });
    expect(task.userId).toBe(alice);
    expect(task.title).toBe('Buy milk');
    expect(task.completed).toBe(false);
    expect(repo.size()).toBe(1);
  });

  it('trims the title before persisting', async () => {
    const task = await create.execute({ userId: alice, title: '   Buy milk   ' });
    expect(task.title).toBe('Buy milk');
  });

  it('rejects an empty title with ValidationError', async () => {
    await expect(
      create.execute({ userId: alice, title: '   ' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('hides another user\'s task behind a 404 — never reveals ownership', async () => {
    const aliceTask = await create.execute({ userId: alice, title: 'Private' });

    await expect(
      get.execute({ userId: bob, taskId: aliceTask.id }),
    ).rejects.toBeInstanceOf(TaskNotFoundError);
  });

  it('allows the owner to read their own task', async () => {
    const aliceTask = await create.execute({ userId: alice, title: 'Mine' });
    const fetched = await get.execute({ userId: alice, taskId: aliceTask.id });
    expect(fetched.id).toBe(aliceTask.id);
  });
});
