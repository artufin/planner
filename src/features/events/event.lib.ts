import { Event } from './event.types';

export function transformEventToCalendarEvent(event: Event) {
    return {
        id: event.id,
        title: event.title,
        start: event.startsAt,
        end: event.endsAt,
        allDay: event.allDay
    }
}