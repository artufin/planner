import { z } from 'zod'

export const createEventSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    startsAt: z.string().min(1, "La fecha de inicio es requerida"),
    endsAt: z.string().min(1, "La fecha de fin es requerida"),
    allDay: z.boolean(),
    description: z.string().optional(),
    kind: z.enum(['meeting', 'appointment', 'reminder']),
    recurrenceRule: z.string().optional(),
    linkedTasksIds: z.array(z.string()).optional(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>