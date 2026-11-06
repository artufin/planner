import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from './http';
import { queryKeys } from './queryKeys';
import { optimisticList, patchById, removeById } from './optimistic';
import type { PlannerTask } from './types';

export function useTasks() {
    return useQuery({
        queryKey: queryKeys.tasks,
        queryFn: () => http.get<PlannerTask[]>('/api/tasks'),
    });
}

export type CreateTaskInput = Omit<PlannerTask, 'id'>;

export function useCreateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateTaskInput) => http.post<PlannerTask>('/api/tasks', input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
    });
}

export type UpdateTaskInput = { id: string } & Partial<CreateTaskInput>;

export function useUpdateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...patch }: UpdateTaskInput) => http.patch<PlannerTask>(`/api/tasks/${id}`, patch),
        ...optimisticList<PlannerTask, UpdateTaskInput>(queryClient, queryKeys.tasks, patchById),
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => http.delete<void>(`/api/tasks/${id}`),
        ...optimisticList<PlannerTask, string>(queryClient, queryKeys.tasks, removeById),
    });
}
