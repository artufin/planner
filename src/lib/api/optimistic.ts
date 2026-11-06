import type { QueryClient, QueryKey } from '@tanstack/react-query';

interface Snapshot<T> {
    previous: T[] | undefined;
}

/**
 * Mutation callbacks that patch a cached list right away and roll back if the
 * request fails — so a dragged card stays where it was dropped instead of
 * snapping back until the refetch lands.
 */
export function optimisticList<T, V>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    apply: (list: T[], vars: V) => T[],
) {
    return {
        onMutate: async (vars: V): Promise<Snapshot<T>> => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData<T[]>(queryKey);
            if (previous) queryClient.setQueryData<T[]>(queryKey, apply(previous, vars));
            return { previous };
        },
        onError: (_error: unknown, _vars: V, context: Snapshot<T> | undefined) => {
            if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey }),
    };
}

export function patchById<T extends { id: string }>(list: T[], vars: { id: string } & Partial<T>): T[] {
    return list.map((item) => (item.id === vars.id ? { ...item, ...vars } : item));
}

export function removeById<T extends { id: string }>(list: T[], id: string): T[] {
    return list.filter((item) => item.id !== id);
}
