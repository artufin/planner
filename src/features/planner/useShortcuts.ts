import { useEffect } from 'react';
import { isDatedView, usePlannerStore } from './store';

/** What ShortcutsDialog lists. Keep in step with the handler below and the hints on TopBar/Sidebar buttons. */
export const SHORTCUTS = [
    { keys: ['←', '→'], label: 'Ir al mes o semana anterior o siguiente' },
    { keys: ['h'], label: 'Ir a hoy' },
    { keys: ['m'], label: 'Vista mes' },
    { keys: ['s'], label: 'Vista semana' },
    { keys: ['p'], label: 'Planificación' },
    { keys: ['n'], label: 'Nueva tarea' },
    { keys: ['['], label: 'Contraer o expandir la barra lateral' },
    { keys: ['?'], label: 'Ver estos atajos' },
] as const;

/** Typing somewhere, so letters are text, not commands. */
function isEditable(el: Element | null): boolean {
    if (!(el instanceof HTMLElement)) return false;
    if (el.isContentEditable) return true;
    return el.closest('input, textarea, select, [role="textbox"], [contenteditable=""], [contenteditable="true"]') !== null;
}

/** Any dialog on screen (form modals, confirmations, the month view's day popover) owns the keyboard. */
function overlayOpen(): boolean {
    return document.querySelector('[role="dialog"], [aria-modal="true"]') !== null;
}

/** A card lifted with the keyboard moves with the arrows — leave those to the drag. */
function keyboardDragActive(el: Element | null): boolean {
    return el instanceof HTMLElement && el.closest('[aria-roledescription][aria-pressed="true"]') !== null;
}

/**
 * Single-key shortcuts for the planner shell. Listens on window, so handlers
 * on document (the modal's Escape, the month popover, keyboard drags) run first
 * and can claim a key with preventDefault.
 */
export function useShortcuts() {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.defaultPrevented || e.isComposing) return;
            // AltGr reports as Ctrl+Alt on Windows, and it's how "[" is typed on Spanish keyboards.
            if ((e.ctrlKey || e.metaKey || e.altKey) && !e.getModifierState('AltGraph')) return;
            if (isEditable(document.activeElement) || isEditable(e.target as Element | null)) return;
            if (overlayOpen()) return;

            const st = usePlannerStore.getState();
            const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

            if (key === 'ArrowLeft' || key === 'ArrowRight') {
                if (!isDatedView(st.view) || keyboardDragActive(document.activeElement)) return;
                e.preventDefault();
                if (key === 'ArrowLeft') st.goPrev();
                else st.goNext();
                return;
            }
            if (e.repeat) return;

            const actions: Record<string, () => void> = {
                h: st.jumpToToday,
                m: st.goToMonth,
                s: st.goToWeek,
                p: st.goToPlanning,
                n: () => st.openTaskModalNew(st.view === 'category' ? st.selectedCategoryId : null),
                '[': st.toggleSidebar,
                '?': st.openShortcuts,
            };
            const action = actions[key];
            if (!action) return;
            e.preventDefault();
            action();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);
}
