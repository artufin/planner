"use client"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import EventForm from "@/features/events/components/EventForm"
import { transformEventToCalendarEvent } from "@/features/events/lib"
import { useEventStore } from "@/features/events/store"
import { useState } from "react"

export default function CalendarView() {
    const events  = useEventStore((state) => state.events);
    const calendarEvents = events.map(transformEventToCalendarEvent);

    const [isFormOpen, setIsFormOpen] = useState(false);

    return (
        <div>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                events={calendarEvents}
            />
            <button onClick={() => setIsFormOpen(!isFormOpen)}>
                {isFormOpen ? 'Cancel' : 'Create Event'}
            </button>
            {isFormOpen && <EventForm />}
        </div>
    )
}