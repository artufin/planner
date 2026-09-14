import type {
    Category as PrismaCategory,
    Group as PrismaGroup,
    PlannerEvent as PrismaPlannerEvent,
    PlannerTask as PrismaPlannerTask,
    ScheduleException as PrismaScheduleException,
    ScheduleItem as PrismaScheduleItem,
    TimeDivision as PrismaTimeDivision,
} from '@prisma/client';
import { toDateOnly, toDateOnlyNullable, toTimeOnly, toTimeOnlyNullable } from './serialize';
import type { Category, Group, PlannerEvent, PlannerTask, ScheduleException, ScheduleItem, TimeDivision } from './types';

export function groupDto(g: PrismaGroup): Group {
    return { id: g.id, name: g.name };
}

export function categoryDto(c: PrismaCategory): Category {
    return { id: c.id, name: c.name, hue: c.hue, groupId: c.groupId };
}

export function scheduleItemDto(s: PrismaScheduleItem): ScheduleItem {
    return {
        id: s.id,
        categoryId: s.categoryId,
        title: s.title,
        weekday: s.weekday,
        start: toTimeOnly(s.start),
        end: toTimeOnly(s.end),
        startDate: toDateOnly(s.startDate),
        endDate: toDateOnlyNullable(s.endDate),
        interval: s.interval as 1 | 2,
    };
}

export function scheduleExceptionDto(e: PrismaScheduleException): ScheduleException {
    return {
        id: e.id,
        scheduleId: e.scheduleId,
        date: toDateOnly(e.date),
        cancelled: e.cancelled,
        title: e.title,
        start: toTimeOnlyNullable(e.start),
        end: toTimeOnlyNullable(e.end),
    };
}

export function plannerEventDto(e: PrismaPlannerEvent): PlannerEvent {
    return {
        id: e.id,
        categoryId: e.categoryId,
        title: e.title,
        startDate: toDateOnly(e.startDate),
        endDate: toDateOnly(e.endDate),
        start: toTimeOnlyNullable(e.start),
        end: toTimeOnlyNullable(e.end),
    };
}

export function plannerTaskDto(t: PrismaPlannerTask): PlannerTask {
    return {
        id: t.id,
        categoryId: t.categoryId,
        eventId: t.eventId,
        title: t.title,
        assignedDate: toDateOnlyNullable(t.assignedDate),
        deadline: toDateOnlyNullable(t.deadline),
        start: toTimeOnlyNullable(t.start),
        end: toTimeOnlyNullable(t.end),
        done: t.done,
    };
}

export function timeDivisionDto(d: PrismaTimeDivision): TimeDivision {
    return { id: d.id, value: toTimeOnly(d.value) };
}
