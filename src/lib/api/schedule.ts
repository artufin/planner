import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from './http';
import { optimisticList } from './optimistic';
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
        ...optimisticList<ScheduleException, UpsertScheduleExceptionInput>(queryClient, queryKeys.scheduleExceptions, upsertException),
    });
}

/** Mirrors the server's upsert-by-(scheduleId, date) so a moved class shows at its new time immediately. */
function upsertException(list: ScheduleException[], input: UpsertScheduleExceptionInput): ScheduleException[] {
    const next: ScheduleException = {
        id: `optimistic-${input.scheduleId}-${input.date}`,
        scheduleId: input.scheduleId,
        date: input.date,
        cancelled: input.cancelled,
        title: input.title ?? null,
        start: input.start ?? null,
        end: input.end ?? null,
    };
    const i = list.findIndex((x) => x.scheduleId === input.scheduleId && x.date === input.date);
    if (i === -1) return [...list, next];
    const copy = list.slice();
    copy[i] = { ...next, id: list[i].id };
    return copy;
}
