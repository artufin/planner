import { z } from 'zod';

export const eventFormSchema = z.object({
    title: z.string().min(1, 'El título es requerido'),
    /** Blank = sin categoría; events may live outside any category. */
    categoryId: z.string(),
    location: z.string(),
    startDate: z.string().min(1, 'La fecha es requerida'),
    hasStartTime: z.boolean(),
    startTime: z.string(),
    hasEndTime: z.boolean(),
    endTime: z.string(),
    /** Only offered for deadline-shaped events (end time, no start time) on creation: spawns a backlog task sharing the title and due date. */
    createTask: z.boolean(),
});
export type EventFormValues = z.infer<typeof eventFormSchema>;

/** `date` may be left blank — the task then lands in the backlog instead of a specific day. */
export const taskFormSchema = z.object({
    title: z.string().min(1, 'El título es requerido'),
    categoryId: z.string().min(1, 'La categoría es requerida'),
    date: z.string(),
    eventId: z.string(),
    hasTime: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    hasDeadline: z.boolean(),
    deadline: z.string(),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const scheduleFormSchema = z
    .object({
        categoryId: z.string().min(1, 'La categoría es requerida'),
        title: z.string(),
        weekday: z.number().min(0).max(6),
        start: z.string(),
        end: z.string(),
        startDate: z.string().min(1, 'La fecha de inicio es requerida'),
        endDate: z.string(),
        biweekly: z.boolean(),
    })
    .refine((v) => !v.endDate || v.endDate >= v.startDate, {
        message: 'La fecha de término no puede ser anterior a la de inicio',
        path: ['endDate'],
    });
export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

/** Fields editable for a single occurrence of a recurring schedule — no weekday/date-range/interval, those belong to the series. */
export const scheduleOccurrenceFormSchema = z.object({
    title: z.string(),
    start: z.string(),
    end: z.string(),
});
export type ScheduleOccurrenceFormValues = z.infer<typeof scheduleOccurrenceFormSchema>;

export const categoryFormSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    hue: z.number(),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
