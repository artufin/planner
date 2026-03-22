"use client"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { transformEventToCalendarEvent } from "@/features/events/event.lib"
import { Event } from "@/features/events/event.types"

export default function CalendarView({ events }: { events: Event[] }) {
    const calendarEvents = events.map(transformEventToCalendarEvent);

    return (
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            events={calendarEvents}
        />
    )
}