import { useMemo } from 'react';

/** Frozen at mount so grid layout stays stable across re-renders within a session. */
export function useToday(): Date {
    return useMemo(() => new Date(), []);
}
