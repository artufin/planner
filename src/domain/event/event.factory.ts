import type { Event, CreateEventInput } from './event.types';
import { nowIso , generateId } from '../shared/utils';

export function createEvent(input: CreateEventInput): Event {
    const now = nowIso();

    return {
        id: generateId(),
        title: input.title,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        allDay: input.allDay,
        description: input.description,
        kind: input.kind,
        recurrenceRule: input.recurrenceRule,
        linkedTasksIds: input.linkedTasksIds,
        createdAt: now,
        updatedAt: now,
    };
}