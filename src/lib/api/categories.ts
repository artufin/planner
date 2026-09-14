import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from './http';
import { queryKeys } from './queryKeys';
import type { Category } from './types';

export function useCategories() {
    return useQuery({
        queryKey: queryKeys.categories,
        queryFn: () => http.get<Category[]>('/api/categories'),
    });
}

export interface CreateCategoryInput {
    name: string;
    hue: number;
    groupId: string | null;
}

export function useCreateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateCategoryInput) => http.post<Category>('/api/categories', input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
    });
}

export type UpdateCategoryInput = { id: string } & Partial<CreateCategoryInput>;

export function useUpdateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...patch }: UpdateCategoryInput) => http.patch<Category>(`/api/categories/${id}`, patch),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => http.delete<void>(`/api/categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categories });
            // Deleting a category cascades to its schedule/events/tasks in the DB.
            queryClient.invalidateQueries({ queryKey: queryKeys.schedule });
            queryClient.invalidateQueries({ queryKey: queryKeys.scheduleExceptions });
            queryClient.invalidateQueries({ queryKey: queryKeys.events });
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
        },
    });
}
