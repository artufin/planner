import type { Event, CreateEventInput } from './types';
import { nowIso , generateId, assertNonEmpty, assertValidDate } from '../../shared/utils';

export function createEvent(input: CreateEventInput): Event {
    const now = nowIso();

    assertNonEmpty(input.title, 'Title');
    assertValidDate(input.startsAt, 'Start Date');
    assertValidDate(input.endsAt, 'End Date');

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