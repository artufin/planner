'use client';

import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MeasuringStrategy,
    MouseSensor,
    TouchSensor,
    pointerWithin,
    rectIntersection,
    useDndContext,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type Announcements,
    type CollisionDetection,
    type DragEndEvent,
    type DragStartEvent,
    type UniqueIdentifier,
} from '@dnd-kit/core';
import { hueVars } from '@/components/ui';
import { useMoveItem } from './useMoveItem';
import { accepts } from './moves';
import type { DragItem, DropTarget } from './types';
import s from './PlannerDnd.module.css';

/**
 * Keyboard drags start only from the focused card itself — Space/Enter on a
 * button inside it (the checkbox, the title) keeps doing what that button does.
 */
class CardKeyboardSensor extends KeyboardSensor {
    static activators = [
        {
            eventName: 'onKeyDown' as const,
            handler: (...args: Parameters<(typeof KeyboardSensor.activators)[0]['handler']>) => {
                const event = args[0] as KeyboardEvent;
                if (event.target !== event.currentTarget) return false;
                return KeyboardSensor.activators[0].handler(...args);
            },
        },
    ];
}

/**
 * The zone under the pointer wins. When zones overlap (the "Por planificar"
 * panel lying over the week grid), the one drawn on top wins. Keyboard drags
 * fall back to overlap.
 */
const collision: CollisionDetection = (args) => {
    const hits = pointerWithin(args);
    if (hits.length > 1 && args.pointerCoordinates) {
        const stack = document.elementsFromPoint(args.pointerCoordinates.x, args.pointerCoordinates.y);
        const depth = (id: UniqueIdentifier) => {
            const node = args.droppableContainers.find((c) => c.id === id)?.node.current;
            const i = node ? stack.findIndex((el) => node.contains(el)) : -1;
            return i === -1 ? Infinity : i;
        };
        return [...hits].sort((a, b) => depth(a.id) - depth(b.id));
    }
    return hits.length > 0 ? hits : rectIntersection(args);
};

/**
 * The pointer's real position during a drag. dnd-kit's `delta` also counts
 * how far a container auto-scrolled, so "start + delta" drifts when the grid
 * scrolls mid-drag; this doesn't.
 */
let livePointerY: number | null = null;
const onPointerMove = (e: PointerEvent) => {
    livePointerY = e.clientY;
};
const onTouchMove = (e: TouchEvent) => {
    livePointerY = e.touches[0]?.clientY ?? livePointerY;
};

function startPointerTracking() {
    livePointerY = null;
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
}

function stopPointerTracking() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('touchmove', onTouchMove);
    livePointerY = null;
}

/** Viewport Y of the pointer in the current drag, or null for keyboard drags. */
export function dragPointerY(activator: Event, deltaY: number): number | null {
    if (livePointerY !== null) return livePointerY;
    const startY =
        activator instanceof MouseEvent
            ? activator.clientY
            : typeof TouchEvent !== 'undefined' && activator instanceof TouchEvent
              ? activator.touches[0]?.clientY
              : undefined;
    return startY === undefined ? null : startY + deltaY;
}

function itemOf(data: unknown): DragItem | null {
    return (data as DragItem | undefined) ?? null;
}

function targetOf(data: unknown): DropTarget | null {
    return (data as DropTarget | undefined) ?? null;
}

const announcements: Announcements = {
    onDragStart: ({ active }) => `Tomaste ${itemOf(active.data.current)?.label ?? 'el elemento'}.`,
    onDragOver: ({ active, over }) => {
        const label = itemOf(active.data.current)?.label ?? 'El elemento';
        const target = targetOf(over?.data.current);
        return target ? `${label} está sobre ${target.label}.` : `${label} no está sobre ningún lugar.`;
    },
    onDragEnd: ({ active, over }) => {
        const label = itemOf(active.data.current)?.label ?? 'El elemento';
        const target = targetOf(over?.data.current);
        return target ? `Soltaste ${label} en ${target.label}.` : `${label} volvió a su lugar.`;
    },
    onDragCancel: ({ active }) => `Cancelado. ${itemOf(active.data.current)?.label ?? 'El elemento'} volvió a su lugar.`,
};

const screenReaderInstructions = {
    draggable:
        'Para mover, presiona espacio o Enter. Usa las flechas para llevarlo a otro lugar, espacio o Enter para soltarlo, o Escape para cancelar.',
};

/** One drag-and-drop context for the whole planner, so a card can travel from any list to any calendar. */
export function PlannerDnd({ children }: { children: ReactNode }) {
    const { drop, resize } = useMoveItem();
    const [active, setActive] = useState<DragItem | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        /** A long press lifts the card; a plain swipe still scrolls. */
        useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
        useSensor(CardKeyboardSensor),
    );

    const onDragStart = (e: DragStartEvent) => {
        startPointerTracking();
        setActive(itemOf(e.active.data.current));
    };

    const onDragEnd = (e: DragEndEvent) => {
        const pointerY = dragPointerY(e.activatorEvent, e.delta.y);
        stopPointerTracking();
        setActive(null);
        const item = itemOf(e.active.data.current);
        if (!item) return;
        if (item.kind === 'resize') {
            resize(item, e.delta.y);
            return;
        }
        const target = targetOf(e.over?.data.current);
        if (!target) return;
        const top = e.active.rect.current.translated?.top ?? 0;
        drop(item, target, { pointerY, top });
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collision}
            /** Re-measure drop zones while dragging: some are frozen at the top of a scrolling grid (the week's "sin hora" strip). */
            measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => {
                stopPointerTracking();
                setActive(null);
            }}
            accessibility={{ announcements, screenReaderInstructions }}
        >
            {children}
            <DragOverlay dropAnimation={null}>
                {active && active.kind !== 'resize'
                    ? (active.overlay ?? (
                          <div className={s.ghost} style={hueVars(active.hue) as CSSProperties}>
                              {active.label}
                          </div>
                      ))
                    : null}
            </DragOverlay>
        </DndContext>
    );
}

/**
 * Makes an element draggable. Spread `handleProps` on it and attach `setNodeRef` as its ref.
 *
 * Destructure the result (the React Compiler lint treats a `.ref`-bearing object as a ref):
 *
 *   const { setNodeRef, handleProps, isDragging } = usePlannerDraggable(`task:${t.id}`, item);
 *   <TaskCard ref={setNodeRef} dragHandleProps={handleProps} placeholder={isDragging} draggable />
 */
export function usePlannerDraggable(id: string, item: DragItem, disabled = false) {
    const d = useDraggable({ id, data: item, disabled, attributes: { roleDescription: 'elemento arrastrable' } });
    return {
        setNodeRef: d.setNodeRef,
        handleProps: disabled ? {} : { ...d.attributes, ...d.listeners },
        isDragging: d.isDragging,
        /** Live drag offset — only the resize handle needs it, to stretch its block while dragging. */
        transform: d.transform,
    };
}

/**
 * Makes an element a drop zone. `isOver` is true only while something it
 * accepts is over it; `isCandidate` while any accepted item is being dragged
 * anywhere — use it to hint where things can go.
 */
export function usePlannerDroppable(id: string, target: DropTarget) {
    const d = useDroppable({ id, data: target });
    const item = itemOf(d.active?.data.current);
    const ok = accepts(item, target);
    return { setNodeRef: d.setNodeRef, isOver: d.isOver && ok, isCandidate: ok };
}

/** The item currently being dragged anywhere in the app, or null. */
export function useActiveDrag(): DragItem | null {
    const { active } = useDndContext();
    return itemOf(active?.data.current);
}
