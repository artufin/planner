'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Checkbox, Modal, SelectField, TextField, TimeInput } from '@planner/ui';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useEvents } from '@/lib/api/events';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/lib/api/tasks';
import { apiErrorMessage } from '@/lib/api/http';
import { taskFormSchema, type TaskFormValues } from '../../schemas';

export default function TaskModal() {
    const { data: categories = [] } = useCategories();
    const { data: events = [] } = useEvents();
    const { data: tasks = [] } = useTasks();
    const taskModal = usePlannerStore((s) => s.taskModal);
    const closeTaskModal = usePlannerStore((s) => s.closeTaskModal);
    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();

    const editingTask = taskModal.editingId ? tasks.find((t) => t.id === taskModal.editingId) : undefined;

    const defaultValues = useMemo<TaskFormValues>(() => {
        if (editingTask) {
            return {
                title: editingTask.title,
                categoryId: editingTask.categoryId,
                date: editingTask.assignedDate ?? '',
                eventId: editingTask.eventId ?? '',
                hasTime: editingTask.start !== null,
                startTime: editingTask.start ?? '09:00',
                endTime: editingTask.end ?? '10:00',
                hasDeadline: !!editingTask.deadline,
                deadline: editingTask.deadline ?? '',
            };
        }
        return {
            title: '',
            categoryId: taskModal.presetCategoryId ?? categories[0]?.id ?? '',
            date: taskModal.presetDate ?? '',
            eventId: '',
            hasTime: false,
            startTime: '09:00',
            endTime: '10:00',
            hasDeadline: false,
            deadline: '',
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { register, handleSubmit, watch, setValue, control } = useForm<TaskFormValues>({
        resolver: zodResolver(taskFormSchema),
        defaultValues,
    });

    const categoryId = watch('categoryId');
    const date = watch('date');
    const eventId = watch('eventId');
    const hasTime = watch('hasTime');
    const hasDeadline = watch('hasDeadline');
    const skipNextCategoryReset = useRef(true);
    const lastSyncedEventId = useRef(defaultValues.eventId);

    useEffect(() => {
        if (skipNextCategoryReset.current) {
            skipNextCategoryReset.current = false;
            return;
        }
        setValue('eventId', '');
    }, [categoryId, setValue]);

    /** Linking a task to an event adopts the event's date as the task's deadline — only when the link actually changes, so a hand-edited deadline survives refetches. */
    useEffect(() => {
        if (eventId === lastSyncedEventId.current) return;
        lastSyncedEventId.current = eventId;
        const linked = eventId ? events.find((e) => e.id === eventId) : undefined;
        if (!linked) return;
        setValue('hasDeadline', true);
        setValue('deadline', linked.startDate);
    }, [eventId, events, setValue]);

    /** Uncategorized events can be linked from any category. */
    const taskEventLinkOptions = events.filter((e) => e.categoryId === categoryId || e.categoryId === null);

    const onSubmit = (values: TaskFormValues) => {
        const onError = (e: unknown) => window.alert(apiErrorMessage(e));
        const payload = {
            categoryId: values.categoryId,
            eventId: values.eventId || null,
            title: values.title.trim(),
            assignedDate: values.date || null,
            start: values.date && values.hasTime ? values.startTime : null,
            end: values.date && values.hasTime ? values.endTime : null,
            deadline: values.hasDeadline && values.deadline ? values.deadline : null,
        };
        if (editingTask) {
            updateTask.mutate({ id: editingTask.id, ...payload }, { onSuccess: closeTaskModal, onError });
        } else {
            createTask.mutate({ ...payload, done: false }, { onSuccess: closeTaskModal, onError });
        }
    };

    return (
        <Modal
            asForm
            title={editingTask ? 'Editar tarea' : 'Nueva tarea'}
            onClose={closeTaskModal}
            onSubmit={handleSubmit(onSubmit)}
            footer={
                <>
                    {editingTask ? (
                        <Button
                            variant="danger"
                            onClick={() =>
                                deleteTask.mutate(editingTask.id, {
                                    onSuccess: closeTaskModal,
                                    onError: (e) => window.alert(apiErrorMessage(e)),
                                })
                            }
                        >
                            Eliminar
                        </Button>
                    ) : (
                        <span />
                    )}
                    <Button type="submit">Guardar</Button>
                </>
            }
        >
            <TextField label="Título" placeholder="ej. Repasar materia" {...register('title')} />
            <SelectField
                label="Categoría"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                {...register('categoryId')}
            />
            <TextField
                label="Fecha (opcional)"
                type="date"
                hint={!date ? 'Sin fecha, la tarea queda en el backlog hasta que le asignes un día.' : undefined}
                {...register('date')}
            />
            <SelectField
                label="Asociar a evento (opcional)"
                placeholder="Ninguno"
                options={taskEventLinkOptions.map((e) => ({ value: e.id, label: e.title }))}
                {...register('eventId')}
            />
            {date && <Checkbox label="Incluir horario" {...register('hasTime')} />}
            {date && hasTime && (
                <div style={{ display: 'flex', gap: 'var(--pl-space-lg)' }}>
                    <div style={{ flex: 1 }}>
                        <Controller
                            name="startTime"
                            control={control}
                            render={({ field }) => <TimeInput label="Hora inicio" value={field.value} onChange={field.onChange} />}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <Controller
                            name="endTime"
                            control={control}
                            render={({ field }) => <TimeInput label="Hora término" value={field.value} onChange={field.onChange} />}
                        />
                    </div>
                </div>
            )}
            <Checkbox label="Incluir fecha límite (deadline)" {...register('hasDeadline')} />
            {hasDeadline && <TextField label="Fecha límite" type="date" {...register('deadline')} />}
        </Modal>
    );
}
