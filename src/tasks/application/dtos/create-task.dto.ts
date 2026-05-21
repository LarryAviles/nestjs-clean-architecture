export interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string | null;
}

export interface TaskOutput {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
