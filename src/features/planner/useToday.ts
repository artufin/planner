import { useMemo, useSyncExternalStore } from 'react';

function todayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Fires at the next local midnight and whenever the tab comes back into view (laptop woken up, tab switched back). */
function subscribeToDayChange(onChange: () => void): () => void {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
        timer = setTimeout(() => {
            onChange();
            schedule();
        }, midnight.getTime() - now.getTime());
    };
    const onVisible = () => {
        if (document.visibilityState === 'visible') onChange();
    };
    schedule();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', onVisible);
    };
}

/**
 * Today's date at local midnight. Stays the same object for the whole day (so
 * layouts keyed on it don't churn) and rolls over at midnight, or when a tab
 * left open overnight comes back into view.
 */
export function useToday(): Date {
    const key = useSyncExternalStore(subscribeToDayChange, todayKey, todayKey);
    return useMemo(() => {
        const [y, m, d] = key.split('-').map(Number);
        return new Date(y, m, d);
    }, [key]);
}

function currentMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

function subscribeToClock(onChange: () => void): () => void {
    const id = window.setInterval(onChange, 30_000);
    return () => window.clearInterval(id);
}

/**
 * Minutes since midnight, refreshed every half minute - drives the "now" line in the week grid.
 * Null on the server, so the rendered markup never disagrees with the client's clock.
 */
export function useNowMinutes(): number | null {
    return useSyncExternalStore(subscribeToClock, currentMinutes, () => null);
}
