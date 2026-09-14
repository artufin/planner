'use client';

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, useDuplicateEvent } from '@/lib/api/events';
import { useCreateTask } from '@/lib/api/tasks';
import { apiErrorMessage } from '@/lib/api/http';
import { eventFormSchema, type EventFormValues } from '../../schemas';
import { checkboxLabelStyle, closeButtonStyle, dangerButtonStyle, inputStyle, labelStyle, modalCardStyle, modalHeaderStyle, modalOverlayStyle, modalTitleStyle, primaryButtonStyle, secondaryButtonStyle } from '../../styles';
import { dateToInput, inputToDate, timeToMinutes } from '../../utils';
import { TimeInput } from '../TimeInput';

export default function EventModal() {
    const { data: categories = [] } = useCategories();
    const { data: events = [] } = useEvents();
    const eventModal = usePlannerStore((s) => s.eventModal);
    const closeEventModal = usePlannerStore((s) => s.closeEventModal);
    const createEvent = useCreateEvent();
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();
    const duplicateEvent = useDuplicateEvent();
    const createTask = useCreateTask();

    const editingEvent = eventModal.editingId ? events.find((e) => e.id === eventModal.editingId) : undefined;

    const defaultValues = useMemo<EventFormValues>(() => {
        if (editingEvent) {
            return {
                title: editingEvent.title,
                categoryId: editingEvent.categoryId,
                startDate: editingEvent.startDate,
                hasStartTime: editingEvent.start !== null,
                startTime: editingEvent.start ?? '09:00',
                hasEndTime: editingEvent.end !== null,
                endTime: editingEvent.end ?? '10:00',
                createTask: false,
            };
        }
        const categoryId = eventModal.presetCategoryId ?? categories[0]?.id ?? '';
        return {
            title: '',
            categoryId,
            startDate: '',
            hasStartTime: false,
            startTime: '09:00',
            hasEndTime: false,
            endTime: '10:00',
            createTask: false,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { register, handleSubmit, watch, control } = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        defaultValues,
    });

    const hasStartTime = watch('hasStartTime');
    const hasEndTime = watch('hasEndTime');
    /** Mirrors utils.isDeadlineEvent: an end time with no start time reads as a due time rather than a scheduled block. */
    const isDeadlineEvent = !hasStartTime && hasEndTime;

    const onSubmit = (values: EventFormValues) => {
        const onError = (e: unknown) => window.alert(apiErrorMessage(e));
        const { y, m, d } = inputToDate(values.startDate);
        /** An end time earlier than the start time means the event runs past midnight into the next day. */
        const overnight = values.hasStartTime && values.hasEndTime && timeToMinutes(values.endTime) < timeToMinutes(values.startTime);
        const end = overnight ? new Date(y, m, d + 1) : new Date(y, m, d);
        const title = values.title.trim();
        const payload = {
            categoryId: values.categoryId,
            title,
            startDate: values.startDate,
            endDate: dateToInput(end.getFullYear(), end.getMonth(), end.getDate()),
            start: values.hasStartTime ? values.startTime : null,
            end: values.hasEndTime ? values.endTime : null,
        };

        if (editingEvent) {
            updateEvent.mutate({ id: editingEvent.id, ...payload }, { onSuccess: closeEventModal, onError });
            return;
        }

        /** An end time with no start time reads as a due time rather than a scheduled block — that's what marks the event as a deliverable/deadline. */
        const isDeadlineEventFlag = !values.hasStartTime && values.hasEndTime;
        createEvent.mutate(payload, {
            onSuccess: (created) => {
                closeEventModal();
                if (isDeadlineEventFlag && values.createTask) {
                    createTask.mutate(
                        {
                            categoryId: values.categoryId,
                            eventId: created.id,
                            title,
                            assignedDate: null,
                            start: null,
                            end: null,
                            deadline: values.startDate,
                            done: false,
                        },
                        { onError },
                    );
                }
            },
            onError,
        });
    };

    return (
        <div style={modalOverlayStyle}>
            <form onSubmit={handleSubmit(onSubmit)} style={modalCardStyle}>
                <div style={modalHeaderStyle}>
                    <div style={modalTitleStyle}>{editingEvent ? 'Editar evento' : 'Agregar evento'}</div>
                    <button type="button" onClick={closeEventModal} style={closeButtonStyle} aria-label="Cerrar">×</button>
                </div>
                <div>
                    <div style={labelStyle}>Título</div>
                    <input {...register('title')} placeholder="ej. Entrega de informe" style={inputStyle} />
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
                    <div style={labelStyle}>Fecha</div>
                    <input type="date" {...register('startDate')} style={inputStyle} />
                </div>
                <label style={checkboxLabelStyle}>
                    <input type="checkbox" {...register('hasStartTime')} />
                    Incluir hora de inicio
                </label>
                {hasStartTime && (
                    <div>
                        <div style={labelStyle}>Hora inicio</div>
                        <Controller name="startTime" control={control} render={({ field }) => <TimeInput value={field.value} onChange={field.onChange} style={inputStyle} />} />
                    </div>
                )}
                <label style={checkboxLabelStyle}>
                    <input type="checkbox" {...register('hasEndTime')} />
                    Incluir hora de término
                </label>
                {hasEndTime && (
                    <div>
                        <div style={labelStyle}>Hora término</div>
                        <Controller name="endTime" control={control} render={({ field }) => <TimeInput value={field.value} onChange={field.onChange} style={inputStyle} />} />
                    </div>
                )}
                {isDeadlineEvent && !editingEvent && (
                    <label style={checkboxLabelStyle}>
                        <input type="checkbox" {...register('createTask')} />
                        Crear tarea
                    </label>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                    {editingEvent ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                type="button"
                                onClick={() =>
                                    deleteEvent.mutate(editingEvent.id, {
                                        onSuccess: closeEventModal,
                                        onError: (e) => window.alert(apiErrorMessage(e)),
                                    })
                                }
                                style={dangerButtonStyle}
                            >
                                Eliminar
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    duplicateEvent.mutate(editingEvent.id, {
                                        onSuccess: closeEventModal,
                                        onError: (e) => window.alert(apiErrorMessage(e)),
                                    })
                                }
                                style={secondaryButtonStyle}
                            >
                                Duplicar
                            </button>
                        </div>
                    ) : (
                        <div />
                    )}
                    <button type="submit" style={primaryButtonStyle}>Guardar</button>
                </div>
            </form>
        </div>
    );
}
