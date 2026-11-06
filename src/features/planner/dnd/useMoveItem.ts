'use client';

import { useUpdateEvent, type UpdateEventInput } from '@/lib/api/events';
import { useUpsertScheduleException } from '@/lib/api/schedule';
import { useUpdateTask, type UpdateTaskInput } from '@/lib/api/tasks';
import { toast } from '../toast/toast';
import { useToday } from '../useToday';
import { addDaysIso, dateToInput, daysBetween, minutesToTime } from '../utils';
import { DAY, SNAP_MINUTES, accepts, dayPhrase, dropY, durationOf, eventAt, snap } from './moves';
import type { DragItem, DropPoint, DropTarget, OccurrenceDrag, ResizeDrag } from './types';

/**
 * Turns a finished drag into the right mutation, with an undo note. The
 * provider calls `drop`/`resize`; views don't need this directly unless they
 * offer a non-drag way to move things (e.g. a "Mover a…" menu).
 */
export function useMoveItem() {
    const updateTask = useUpdateTask();
    const updateEvent = useUpdateEvent();
    const upsertException = useUpsertScheduleException();
    const today = useToday();
    const todayIso = dateToInput(today.getFullYear(), today.getMonth(), today.getDate());

    const patchTask = (next: UpdateTaskInput, undo: UpdateTaskInput, message: string) => {
        updateTask.mutate(next, { onError: toast.error });
        toast.show(message, { label: 'Deshacer', onAction: () => updateTask.mutate(undo, { onError: toast.error }) });
    };

    const patchEvent = (next: UpdateEventInput, undo: UpdateEventInput, message: string) => {
        updateEvent.mutate(next, { onError: toast.error });
        toast.show(message, { label: 'Deshacer', onAction: () => updateEvent.mutate(undo, { onError: toast.error }) });
    };

    const retimeOccurrence = (item: OccurrenceDrag, startMin: number, endMin: number) => {
        const start = minutesToTime(startMin);
        const end = minutesToTime(endMin);
        if (start === item.start && end === item.end) return;
        const base = { scheduleId: item.scheduleId, date: item.date, cancelled: false, title: item.titleOverride };
        upsertException.mutate({ ...base, start, end }, { onError: toast.error });
        toast.show(`Solo esta clase quedó de ${start} a ${end}`, {
            label: 'Deshacer',
            onAction: () =>
                upsertException.mutate(
                    { ...base, start: item.previous?.start ?? null, end: item.previous?.end ?? null },
                    { onError: toast.error },
                ),
        });
    };

    const drop = (item: DragItem, target: DropTarget, point: DropPoint) => {
        if (!accepts(item, target) || item.kind === 'resize') return;

        if (item.kind === 'occurrence') {
            if (target.kind !== 'timeline') return;
            const length = durationOf(item);
            const startMin = Math.min(Math.max(0, snap(target.minuteAt(dropY(item, point)))), DAY - length);
            retimeOccurrence(item, startMin, startMin + length);
            return;
        }

        if (item.kind === 'task') {
            const t = item.task;
            const undo: UpdateTaskInput = { id: t.id, assignedDate: t.assignedDate, start: t.start, end: t.end };
            if (target.kind === 'backlog') {
                if (t.assignedDate === null) return;
                patchTask({ id: t.id, assignedDate: null, start: null, end: null }, undo, 'Tarea devuelta a Por planificar');
                return;
            }
            if (target.kind === 'day') {
                const clear = target.clearTime || t.assignedDate === null;
                if (t.assignedDate === target.date && (!clear || t.start === null)) return;
                /** A time set for a day stays with the task when it moves to another day, but not out of the backlog. */
                const times = clear ? { start: null, end: null } : {};
                patchTask({ id: t.id, assignedDate: target.date, ...times }, undo, `Tarea movida ${dayPhrase(target.date, todayIso)}`);
                return;
            }
            const length = durationOf(item);
            const startMin = Math.min(Math.max(0, snap(target.minuteAt(dropY(item, point)))), DAY - length);
            const start = minutesToTime(startMin);
            const end = minutesToTime(startMin + length);
            if (t.assignedDate === target.date && t.start === start && t.end === end) return;
            patchTask(
                { id: t.id, assignedDate: target.date, start, end },
                undo,
                `Tarea movida ${dayPhrase(target.date, todayIso)}, ${start}`,
            );
            return;
        }

        // event
        const ev = item.event;
        const undo: UpdateEventInput = { id: ev.id, startDate: ev.startDate, endDate: ev.endDate, start: ev.start, end: ev.end };
        if (target.kind === 'day') {
            const shift = daysBetween(item.fromDate, target.date);
            const clear = target.clearTime === true && (ev.start !== null || ev.end !== null);
            if (shift === 0 && !clear) return;
            /** Into the all-day strip: the event becomes a one-day, untimed event on that day. */
            const next = clear
                ? { startDate: target.date, endDate: target.date, start: null, end: null }
                : { startDate: addDaysIso(ev.startDate, shift), endDate: addDaysIso(ev.endDate, shift) };
            patchEvent(
                { id: ev.id, ...next },
                undo,
                `Evento movido ${dayPhrase(next.startDate, todayIso)}`,
            );
            return;
        }
        if (target.kind !== 'timeline') return;
        const length = ev.start === null && ev.end !== null ? 0 : durationOf(item);
        const startMin = Math.min(Math.max(0, snap(target.minuteAt(dropY(item, point)))), DAY - 1 - Math.min(length, DAY - 1));
        const next = eventAt(item, target.date, startMin);
        if (next.startDate === ev.startDate && next.start === ev.start && next.end === ev.end && next.endDate === ev.endDate) return;
        patchEvent(
            { id: ev.id, ...next },
            undo,
            `Evento movido ${dayPhrase(target.date, todayIso)}, ${next.start ?? next.end}`,
        );
    };

    /** The bottom handle of a block was dragged `deltaY` px: change its end time, never below 15 min. */
    const resize = (item: ResizeDrag, deltaY: number) => {
        const endMin = Math.min(DAY - 1, Math.max(item.startMin + SNAP_MINUTES, snap(item.endMin + deltaY / item.pxPerMinute)));
        if (endMin === item.endMin) return;
        const end = minutesToTime(endMin);
        const of = item.of;
        if (of.kind === 'occurrence') {
            retimeOccurrence(of, item.startMin, endMin);
            return;
        }
        if (of.kind === 'task') {
            const t = of.task;
            patchTask({ id: t.id, end }, { id: t.id, end: t.end }, `Ahora termina a las ${end}`);
            return;
        }
        const ev = of.event;
        /** Resizing on the grid only ever edits the end on the day it's drawn. */
        patchEvent({ id: ev.id, end, endDate: item.date }, { id: ev.id, end: ev.end, endDate: ev.endDate }, `Ahora termina a las ${end}`);
    };

    return { drop, resize };
}
