import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from './http';
import { queryKeys } from './queryKeys';
import type { ScheduleException, ScheduleItem } from './types';

export function useSchedule() {
    return useQuery({
        queryKey: queryKeys.schedule,
        queryFn: () => http.get<ScheduleItem[]>('/api/schedule'),
    });
}

export function useScheduleExceptions() {
    return useQuery({
        queryKey: queryKeys.scheduleExceptions,
        queryFn: () => http.get<ScheduleException[]>('/api/schedule-exceptions'),
    });
}

export type CreateScheduleInput = Omit<ScheduleItem, 'id'>;

export function useCreateScheduleItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateScheduleInput) => http.post<ScheduleItem>('/api/schedule', input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.schedule }),
    });
}

export type UpdateScheduleInput = { id: string } & Partial<CreateScheduleInput>;

export function useUpdateScheduleItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...patch }: UpdateScheduleInput) => http.patch<ScheduleItem>(`/api/schedule/${id}`, patch),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.schedule }),
    });
}

export function useDeleteScheduleItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => http.delete<void>(`/api/schedule/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.schedule });
            // Deleting a ScheduleItem cascades to its exceptions in the DB.
            queryClient.invalidateQueries({ queryKey: queryKeys.scheduleExceptions });
        },
    });
}

/** Upserts by (scheduleId, date) — used both to override an occurrence and to cancel it (cancelled: true). */
export interface UpsertScheduleExceptionInput {
    scheduleId: string;
    date: string;
    cancelled: boolean;
    title?: string | null;
    start?: string | null;
    end?: string | null;
}

export function useUpsertScheduleException() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: UpsertScheduleExceptionInput) => http.put<ScheduleException>('/api/schedule-exceptions', input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.scheduleExceptions }),
    });
}
