import type { ReactNode } from 'react';
import type { PlannerEvent, PlannerTask } from '@/lib/api/types';

/**
 * What is being dragged. Every view registers its draggables with one of these
 * as `data`; the provider reads it on drop and performs the move.
 *
 * Draggable ids must be unique across the whole app (one DndContext):
 *   task      `task:<taskId>`
 *   event     `event:<eventId>:<fromDate>`   (a multi-day event shows on several days)
 *   occurrence `occ:<scheduleId>:<date>`
 *   resize    `resize:<one of the above>`
 */
export type DragItem = TaskDrag | EventDrag | OccurrenceDrag | ResizeDrag;

interface DragBase {
    /** Spoken by screen readers and used in the undo note, e.g. "Leer capítulo 3". */
    label: string;
    hue: number | null;
    /** What follows the pointer. Defaults to a small chip with `label` in the `hue` color. */
    overlay?: ReactNode;
}

export interface TaskDrag extends DragBase {
    kind: 'task';
    task: PlannerTask;
}

export interface EventDrag extends DragBase {
    kind: 'event';
    event: PlannerEvent;
    /** The day it was picked up from — a multi-day event moves by the distance from here to the drop day. */
    fromDate: string;
}

/** A single occurrence of a recurring class. Moves only that session, and only within its own day. */
export interface OccurrenceDrag extends DragBase {
    kind: 'occurrence';
    scheduleId: string;
    date: string;
    start: string;
    end: string;
    /** The occurrence's current title override (from its exception), kept when it's moved. */
    titleOverride: string | null;
    /** The exception as it stands before the move — what "Deshacer" restores. Null when there is none. */
    previous: { start: string | null; end: string | null } | null;
}

/** The bottom-edge handle of a block on the hour grid. Dragging it changes the end time. */
export interface ResizeDrag extends DragBase {
    kind: 'resize';
    of: TaskDrag | EventDrag | OccurrenceDrag;
    date: string;
    startMin: number;
    endMin: number;
    /** Grid scale, to turn the vertical drag distance into minutes. */
    pxPerMinute: number;
}

/** Where a drag can land. Registered as droppable `data`. */
export type DropTarget = BacklogTarget | DayTarget | TimelineTarget;

export interface BacklogTarget {
    kind: 'backlog';
    label: string;
}

/** A whole day (planning column, month cell, all-day strip): keeps the item's times unless `clearTime`. */
export interface DayTarget {
    kind: 'day';
    date: string;
    label: string;
    /** The week view's all-day strip: whatever lands here loses its start/end time. */
    clearTime?: boolean;
}

/** A day column on the hour grid: the drop height decides the start time. */
export interface TimelineTarget {
    kind: 'timeline';
    date: string;
    label: string;
    /** Minutes since midnight at a viewport Y coordinate. The provider snaps the result to 15 min. */
    minuteAt: (clientY: number) => number;
}

/** Where on screen the drag ended — see `dropY`. */
export interface DropPoint {
    /** The pointer's Y, or null for keyboard drags. */
    pointerY: number | null;
    /** The dragged node's top edge, after the move. */
    top: number;
}
