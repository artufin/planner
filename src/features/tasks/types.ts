import type { EntityId, ISODateTime } from '../../shared/types';

export type TaskStatus = 'to-do' | 'in-progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
    id: EntityId;
    title: string;
    description?: string;
    status: TaskStatus;
    priority?: TaskPriority;
    dueDate?: ISODateTime;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
    }

export interface CreateTaskInput {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: ISODateTime;
}