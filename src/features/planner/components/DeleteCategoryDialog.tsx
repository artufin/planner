'use client';

import { useDeleteCategory } from '@/lib/api/categories';
import { useSchedule } from '@/lib/api/schedule';
import { useEvents } from '@/lib/api/events';
import { useTasks } from '@/lib/api/tasks';
import type { Category } from '@/lib/api/types';
import { toast } from '../toast/toast';
import ConfirmDialog from './ConfirmDialog';
import { plural } from './views/subjectInsights';

/** "a", "a y b", "a, b y c". */
function listEs(items: string[]): string {
    if (items.length <= 1) return items.join('');
    return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

/**
 * Deleting a category takes its schedule, events and tasks with it (the DB
 * cascades), so the confirmation counts exactly what goes.
 */
export default function DeleteCategoryDialog({
    category,
    onCancel,
    onDeleted,
}: {
    category: Category;
    onCancel: () => void;
    onDeleted: () => void;
}) {
    const { data: schedule = [] } = useSchedule();
    const { data: events = [] } = useEvents();
    const { data: tasks = [] } = useTasks();
    const deleteCategory = useDeleteCategory();

    const parts = [
        { n: schedule.filter((x) => x.categoryId === category.id).length, one: 'horario', many: 'horarios' },
        { n: events.filter((e) => e.categoryId === category.id).length, one: 'evento', many: 'eventos' },
        { n: tasks.filter((t) => t.categoryId === category.id).length, one: 'tarea', many: 'tareas' },
    ]
        .filter((p) => p.n > 0)
        .map((p) => plural(p.n, p.one, p.many));

    return (
        <ConfirmDialog
            title="Eliminar categoría"
            confirmLabel="Eliminar categoría"
            pending={deleteCategory.isPending}
            onCancel={onCancel}
            onConfirm={() => deleteCategory.mutate(category.id, { onSuccess: onDeleted, onError: toast.error })}
        >
            <p>
                Vas a eliminar <strong>{category.name}</strong>.{' '}
                {parts.length > 0
                    ? `También se eliminará todo lo que contiene: ${listEs(parts)}.`
                    : 'No tiene horarios, eventos ni tareas.'}
            </p>
            <p>No se puede deshacer.</p>
        </ConfirmDialog>
    );
}
