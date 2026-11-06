import { create } from 'zustand';
import { apiErrorMessage } from '@/lib/api/http';

export interface ToastAction {
    label: string;
    onAction: () => void;
}

export interface Toast {
    id: number;
    message: string;
    tone: 'info' | 'error';
    action?: ToastAction;
}

interface ToastState {
    toasts: Toast[];
    dismiss: (id: number) => void;
}

/** One note at a time on screen is plenty; older ones are dropped. */
const MAX_TOASTS = 3;
const DURATION_MS = { info: 5000, error: 7000 } as const;

let nextId = 1;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>()((set) => ({
    toasts: [],
    dismiss: (id) => {
        const t = timers.get(id);
        if (t) clearTimeout(t);
        timers.delete(id);
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    },
}));

function push(toast: Omit<Toast, 'id'>): number {
    const id = nextId++;
    useToastStore.setState((s) => ({ toasts: [...s.toasts, { ...toast, id }].slice(-MAX_TOASTS) }));
    timers.set(
        id,
        setTimeout(() => useToastStore.getState().dismiss(id), DURATION_MS[toast.tone]),
    );
    return id;
}

/**
 * Bottom-of-screen notes. Callable from anywhere (event handlers, mutation
 * callbacks) — no hook needed.
 *
 *   toast.show('Tarea movida al jueves', { label: 'Deshacer', onAction: undo })
 *   toast.error(e)  // replaces window.alert(apiErrorMessage(e))
 */
export const toast = {
    show(message: string, action?: ToastAction): number {
        return push({ message, tone: 'info', action });
    },
    /** Accepts an API error (or anything thrown) or a ready message. */
    error(error: unknown): number {
        const message = typeof error === 'string' ? error : apiErrorMessage(error);
        return push({ message, tone: 'error' });
    },
    dismiss(id: number) {
        useToastStore.getState().dismiss(id);
    },
};
