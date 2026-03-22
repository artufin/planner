import { createEvent } from "@/features/events/event.factory";
import CalendarView from "@/components/calendar/CalendarView";

export default function CalendarPage() {
    const event1 = createEvent({
        title: 'CLIC',
        startsAt: "2026-03-25T10:00:00.000Z",
        endsAt: "2026-03-25T12:00:00.000Z",
        allDay: false,
        kind: 'meeting'
    })

    return (
        <CalendarView
        events={[event1]}
        />
    )
}