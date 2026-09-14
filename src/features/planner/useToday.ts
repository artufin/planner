import { useMemo, useSyncExternalStore } from 'react';

/** Frozen at mount so grid layout stays stable across re-renders within a session. */
export function useToday(): Date {
    return useMemo(() => new Date(), []);
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
