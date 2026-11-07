'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Checkbox, Modal, SelectField, TextField, TimeInput } from '@/components/ui';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useEvents } from '@/lib/api/events';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/lib/api/tasks';
import { toast } from '../../toast/toast';
import type { PlannerTask } from '@/lib/api/types';
import { taskFormSchema, type TaskFormValues } from '../../schemas';
import s from './modal.module.css';

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
        const onError = toast.error;
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

    /** Deletes at once and offers the way back, instead of asking first. The undo is a fresh copy (new id). */
    const deleteWithUndo = (task: PlannerTask) => {
        const { id, ...fields } = task;
        closeTaskModal();
        // mutateAsync: the modal is gone before the request settles, and mutate's callbacks die with it.
        deleteTask
            .mutateAsync(id)
            .then(() =>
                toast.show('Tarea eliminada', {
                    label: 'Deshacer',
                    onAction: () => void createTask.mutateAsync(fields).catch(toast.error),
                }),
            )
            .catch(toast.error);
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
                        <Button variant="danger" onClick={() => deleteWithUndo(editingTask)}>
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
            <div className={s.group} role="group" aria-labelledby="task-when">
                <p className={s.groupTitle} id="task-when">Cuándo hacerla</p>
                <TextField
                    label="Día"
                    optional
                    type="date"
                    hint={!date ? 'Sin día, la tarea queda en el backlog hasta que le asignes uno.' : undefined}
                    {...register('date')}
                />
                {date && <Checkbox label="Con horario" {...register('hasTime')} />}
                {date && hasTime && (
                    <div className={s.row}>
                        <Controller
                            name="startTime"
                            control={control}
                            render={({ field }) => <TimeInput label="Inicio" value={field.value} onChange={field.onChange} />}
                        />
                        <Controller
                            name="endTime"
                            control={control}
                            render={({ field }) => <TimeInput label="Término" value={field.value} onChange={field.onChange} />}
                        />
                    </div>
                )}
            </div>
            <div className={s.group} role="group" aria-labelledby="task-due">
                <p className={s.groupTitle} id="task-due">Para cuándo es</p>
                <SelectField
                    label="Evento asociado"
                    optional
                    placeholder="Ninguno"
                    hint="Al asociarla a un evento, la fecha del evento pasa a ser su fecha límite."
                    options={taskEventLinkOptions.map((e) => ({ value: e.id, label: e.title }))}
                    {...register('eventId')}
                />
                <Checkbox label="Tiene fecha límite" {...register('hasDeadline')} />
                {hasDeadline && <TextField label="Fecha límite" type="date" {...register('deadline')} />}
            </div>
        </Modal>
    );
}
