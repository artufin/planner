'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useEvents } from '@/lib/api/events';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/lib/api/tasks';
import { apiErrorMessage } from '@/lib/api/http';
import { taskFormSchema, type TaskFormValues } from '../../schemas';
import { checkboxLabelStyle, closeButtonStyle, colors, dangerButtonStyle, inputStyle, labelStyle, modalCardStyle, modalHeaderStyle, modalOverlayStyle, modalTitleStyle, primaryButtonStyle } from '../../styles';
import { TimeInput } from '../TimeInput';

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
        <div style={modalOverlayStyle}>
            <form onSubmit={handleSubmit(onSubmit)} style={modalCardStyle}>
                <div style={modalHeaderStyle}>
                    <div style={modalTitleStyle}>{editingTask ? 'Editar tarea' : 'Nueva tarea'}</div>
                    <button type="button" onClick={closeTaskModal} style={closeButtonStyle} aria-label="Cerrar">×</button>
                </div>
                <div>
                    <div style={labelStyle}>Título</div>
                    <input {...register('title')} placeholder="ej. Repasar materia" style={inputStyle} />
                </div>
                <div>
                    <div style={labelStyle}>Categoría</div>
                    <select {...register('categoryId')} style={inputStyle}>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <div style={labelStyle}>Fecha (opcional)</div>
                    <input type="date" {...register('date')} style={inputStyle} />
                    {!date && (
                        <div style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                            Sin fecha, la tarea queda en el backlog hasta que le asignes un día.
                        </div>
                    )}
                </div>
                <div>
                    <div style={labelStyle}>Asociar a evento (opcional)</div>
                    <select {...register('eventId')} style={inputStyle}>
                        <option value="">Ninguno</option>
                        {taskEventLinkOptions.map((e) => (
                            <option key={e.id} value={e.id}>{e.title}</option>
                        ))}
                    </select>
                </div>
                {date && (
                    <label style={checkboxLabelStyle}>
                        <input type="checkbox" {...register('hasTime')} />
                        Incluir horario
                    </label>
                )}
                {date && hasTime && (
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                            <div style={labelStyle}>Hora inicio</div>
                            <Controller name="startTime" control={control} render={({ field }) => <TimeInput value={field.value} onChange={field.onChange} style={inputStyle} />} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={labelStyle}>Hora término</div>
                            <Controller name="endTime" control={control} render={({ field }) => <TimeInput value={field.value} onChange={field.onChange} style={inputStyle} />} />
                        </div>
                    </div>
                )}
                <label style={checkboxLabelStyle}>
                    <input type="checkbox" {...register('hasDeadline')} />
                    Incluir fecha límite (deadline)
                </label>
                {hasDeadline && (
                    <div>
                        <div style={labelStyle}>Fecha límite</div>
                        <input type="date" {...register('deadline')} style={inputStyle} />
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                    {editingTask ? (
                        <button
                            type="button"
                            onClick={() =>
                                deleteTask.mutate(editingTask.id, {
                                    onSuccess: closeTaskModal,
                                    onError: (e) => window.alert(apiErrorMessage(e)),
                                })
                            }
                            style={dangerButtonStyle}
                        >
                            Eliminar
                        </button>
                    ) : (
                        <div />
                    )}
                    <button type="submit" style={primaryButtonStyle}>Guardar</button>
                </div>
            </form>
        </div>
    );
}
