'use client';

/* ---- click guard --------------------------------------------------------
   A block dropped back near where it was picked up can end the drag with the
   pointer still over its own button, and the browser then fires a click on it.
   The week view notes when every drag ends; clicks right after are ignored. */

let lastDragEnd = -Infinity;

export function noteDragEnd() {
    lastDragEnd = performance.now();
}

/** True for the click that a drag's mouseup produces. */
export function justDragged(): boolean {
    return performance.now() - lastDragEnd < 250;
}
