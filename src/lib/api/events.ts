import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from './http';
import { queryKeys } from './queryKeys';
import type { PlannerEvent } from './types';

export function useEvents() {
    return useQuery({
        queryKey: queryKeys.events,
        queryFn: () => http.get<PlannerEvent[]>('/api/events'),
    });
}

export type CreateEventInput = Omit<PlannerEvent, 'id'>;

export function useCreateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateEventInput) => http.post<PlannerEvent>('/api/events', input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.events }),
    });
}

export type UpdateEventInput = { id: string } & Partial<CreateEventInput>;

export function useUpdateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...patch }: UpdateEventInput) => http.patch<PlannerEvent>(`/api/events/${id}`, patch),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.events }),
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => http.delete<void>(`/api/events/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.events });
            // Deleting an event clears eventId on any linked tasks (SetNull) in the DB.
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
        },
    });
}

export function useDuplicateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => http.post<PlannerEvent>(`/api/events/${id}/duplicate`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.events }),
    });
}
