"use client"

import { useEventStore } from "../store";
import { createEvent } from "../factory";
import { EventKind } from "../types";

export default function EventForm() {
    const addEvent = useEventStore((state) => state.addEvent)

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        const title = formData.get("title") as string;
        const startsAt = formData.get("startsAt") as string;
        const endsAt = formData.get("endsAt") as string;
        const allDay = formData.get("allDay") === "on";
        const description = formData.get("description") as string;
        const kind = formData.get("kind") as EventKind;
        const recurrenceRule = formData.get("recurrenceRule") as string;

        const event = createEvent({ title, startsAt, endsAt, allDay, description, kind, recurrenceRule });
        addEvent(event);
    };


    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="title" placeholder="Title" required />
            <input type="datetime-local" name="startsAt" required />
            <input type="datetime-local" name="endsAt" required />
            <input type="checkbox" name="allDay" />
            <label htmlFor="allDay">All Day</label>
            <textarea name="description" placeholder="Description"></textarea>
            <select name="kind">
                <option value={'meeting'}>Meeting</option>
                <option value={'appointment'}>Appointment</option>
                <option value={'reminder'}>Reminder</option>
            </select>
            <input type="text" name="recurrenceRule" placeholder="Recurrence Rule" />
            <button type="submit">Add Event</button>
        </form>
    )
}