import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from './http';
import { queryKeys } from './queryKeys';
import type { TimeDivision } from './types';

export function useTimeDivisions() {
    return useQuery({
        queryKey: queryKeys.timeDivisions,
        queryFn: () => http.get<TimeDivision[]>('/api/time-divisions'),
    });
}

/** Idempotent server-side (upsert by value), matching the store's previous `.includes` de-dupe. */
export function useAddTimeDivision() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (value: string) => http.post<TimeDivision>('/api/time-divisions', { value }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.timeDivisions }),
    });
}

export function useDeleteTimeDivision() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (value: string) => http.delete<void>(`/api/time-divisions?value=${encodeURIComponent(value)}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.timeDivisions }),
    });
}
