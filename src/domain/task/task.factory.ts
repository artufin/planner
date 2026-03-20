import type { Task, CreateTaskInput } from './task.types';
import { nowIso , generateId, assertNonEmpty } from '../shared/utils';

export function createTask(input: CreateTaskInput): Task {
    const now = nowIso();

    assertNonEmpty(input.title, 'Title');


    return {
        id: generateId(),
        title: input.title,
        description: input.description,
        status: input.status || 'to-do',
        priority: input.priority,
        dueDate: input.dueDate,
        createdAt: now,
        updatedAt: now,
    };
}
