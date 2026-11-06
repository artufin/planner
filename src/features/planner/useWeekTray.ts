'use client';

import { useSyncExternalStore } from 'react';

/* The week view's "Por planificar" side panel, open or closed. Toggled from the
   top bar, rendered by the week view. */

const TRAY_KEY = 'planner:week-tray-open';
const listeners = new Set<() => void>();
/** Set once toggled in this tab, so a blocked localStorage still lets the panel open and close. */
let memory: boolean | null = null;

function readTrayOpen(): boolean {
    if (memory !== null) return memory;
    try {
        return window.localStorage.getItem(TRAY_KEY) === '1';
    } catch {
        return false;
    }
}

function subscribe(onChange: () => void): () => void {
    const onStorage = (e: StorageEvent) => {
        if (e.key !== TRAY_KEY) return;
        memory = null;
        onChange();
    };
    listeners.add(onChange);
    window.addEventListener('storage', onStorage);
    return () => {
        listeners.delete(onChange);
        window.removeEventListener('storage', onStorage);
    };
}

function setTrayOpen(open: boolean) {
    memory = open;
    try {
        window.localStorage.setItem(TRAY_KEY, open ? '1' : '0');
    } catch {
        /* storage blocked — it stays as set until the page reloads */
    }
    listeners.forEach((l) => l());
}

/** Whether the week view's side panel is open; closed on the server so hydration matches, then the stored choice. */
export function useWeekTrayOpen(): [boolean, (open: boolean) => void] {
    const open = useSyncExternalStore(subscribe, readTrayOpen, () => false);
    return [open, setTrayOpen];
}
