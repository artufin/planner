/** Wire/app-level shapes returned by the API routes — plain 'YYYY-MM-DD' / 'HH:MM' strings, never Prisma's Date objects. */

export interface Group {
    id: string;
    name: string;
}

export interface Category {
    id: string;
    name: string;
    hue: number;
    groupId: string | null;
}

export interface ScheduleItem {
    id: string;
    categoryId: string;
    title: string;
    weekday: number; // 0=domingo ... 6=sábado
    start: string; // HH:MM
    end: string; // HH:MM
    startDate: string; // YYYY-MM-DD
    endDate: string | null; // YYYY-MM-DD inclusive, or null for no end
    interval: 1 | 2;
}

export interface ScheduleException {
    id: string;
    scheduleId: string;
    date: string; // YYYY-MM-DD
    cancelled: boolean;
    title: string | null;
    start: string | null; // HH:MM
    end: string | null; // HH:MM
}

export interface PlannerEvent {
    id: string;
    categoryId: string | null; // null = sin categoría
    title: string;
    location: string | null;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD inclusive
    start: string | null; // HH:MM, null = no start time
    end: string | null; // HH:MM, null = no end time
}

export interface PlannerTask {
    id: string;
    categoryId: string;
    eventId: string | null;
    title: string;
    assignedDate: string | null; // YYYY-MM-DD, null = backlog
    deadline: string | null; // YYYY-MM-DD
    start: string | null; // HH:MM
    end: string | null; // HH:MM
    done: boolean;
}

export interface TimeDivision {
    id: string;
    value: string; // HH:MM
}
