import type { Task, CreateTaskInput } from './types';
import { nowIso , generateId, assertNonEmpty, assertValidDate } from '../../shared/utils';

export function createTask(input: CreateTaskInput): Task {
    const now = nowIso();

    assertNonEmpty(input.title, 'Title');
    if (input.dueDate) {
        assertValidDate(input.dueDate, 'Due Date');
    }

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
