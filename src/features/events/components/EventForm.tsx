"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEventStore } from "../store";
import { createEvent } from "../factory";
import { createEventSchema, CreateEventInput } from "../schema";

export default function EventForm() {
    const addEvent = useEventStore((state) => state.addEvent)
    
    const { register, handleSubmit, formState: { errors } } = useForm<CreateEventInput>({
        resolver: zodResolver(createEventSchema)
    });

    const onSubmit = (data: CreateEventInput) => {
        const newEvent = createEvent(data);
        addEvent(newEvent);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <input {...register("title")} placeholder="Título" />
            {errors.title && <p>{errors.title.message}</p>}
            
            <input type="datetime-local" {...register("startsAt")} />
            {errors.startsAt && <p>{errors.startsAt.message}</p>}

            <input type="datetime-local" {...register("endsAt")} />
            {errors.endsAt && <p>{errors.endsAt.message}</p>}

            <input type="checkbox" {...register("allDay")} />

            <textarea {...register("description")} />

            <select {...register("kind")}>
                <option value="meeting">Meeting</option>
                <option value="appointment">Appointment</option>
                <option value="reminder">Reminder</option>
            </select>

            <button type="submit">Crear</button>
        </form>
    )
}