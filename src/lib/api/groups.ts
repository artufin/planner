import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from './http';
import { queryKeys } from './queryKeys';
import type { Group } from './types';

export function useGroups() {
    return useQuery({
        queryKey: queryKeys.groups,
        queryFn: () => http.get<Group[]>('/api/groups'),
    });
}

export function useCreateGroup() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => http.post<Group>('/api/groups', { name }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
    });
}

export function useRenameGroup() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => http.patch<Group>(`/api/groups/${id}`, { name }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
    });
}

export function useDeleteGroup() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => http.delete<void>(`/api/groups/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
    });
}
