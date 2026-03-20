import type { EntityId, ISODateTime } from '../shared/types';

export type EventKind = 'meeting' | 'appointment' | 'reminder';

export interface Event {
    id: EntityId;
    title: string;
    startsAt: ISODateTime;
    endsAt: ISODateTime;
    allDay: boolean;
    description?: string;
    kind: EventKind;
    recurrenceRule?: string;
    linkedTasksIds?: EntityId[];
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}

export interface CreateEventInput {
    title: string;
    startsAt: ISODateTime;
    endsAt: ISODateTime;
    allDay: boolean;
    description?: string;
    kind: EventKind;
    recurrenceRule?: string;
    linkedTasksIds?: EntityId[];
}