'use client';

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Checkbox, Modal, SelectField, TextField, TimeInput } from '@planner/ui';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, useDuplicateEvent } from '@/lib/api/events';
import { useCreateTask } from '@/lib/api/tasks';
import { apiErrorMessage } from '@/lib/api/http';
import { eventFormSchema, type EventFormValues } from '../../schemas';
import { dateToInput, inputToDate, timeToMinutes } from '../../utils';

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
                categoryId: editingEvent.categoryId ?? '',
                location: editingEvent.location ?? '',
                startDate: editingEvent.startDate,
                hasStartTime: editingEvent.start !== null,
                startTime: editingEvent.start ?? '09:00',
                hasEndTime: editingEvent.end !== null,
                endTime: editingEvent.end ?? '10:00',
                createTask: false,
            };
        }
        return {
            title: '',
            categoryId: eventModal.presetCategoryId ?? '',
            location: '',
            startDate: eventModal.presetDate ?? '',
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
    const categoryId = watch('categoryId');
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
            categoryId: values.categoryId || null,
            title,
            location: values.location.trim() || null,
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
                if (isDeadlineEventFlag && values.createTask && values.categoryId) {
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
        <Modal
            asForm
            title={editingEvent ? 'Editar evento' : 'Agregar evento'}
            onClose={closeEventModal}
            onSubmit={handleSubmit(onSubmit)}
            footer={
                <>
                    {editingEvent ? (
                        <div style={{ display: 'flex', gap: 'var(--pl-space-md)' }}>
                            <Button
                                variant="danger"
                                onClick={() =>
                                    deleteEvent.mutate(editingEvent.id, {
                                        onSuccess: closeEventModal,
                                        onError: (e) => window.alert(apiErrorMessage(e)),
                                    })
                                }
                            >
                                Eliminar
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    duplicateEvent.mutate(editingEvent.id, {
                                        onSuccess: closeEventModal,
                                        onError: (e) => window.alert(apiErrorMessage(e)),
                                    })
                                }
                            >
                                Duplicar
                            </Button>
                        </div>
                    ) : (
                        <span />
                    )}
                    <Button type="submit">Guardar</Button>
                </>
            }
        >
            <TextField label="Título" placeholder="ej. Entrega de informe" {...register('title')} />
            <SelectField
                label="Categoría (opcional)"
                placeholder="Sin categoría"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                {...register('categoryId')}
            />
            <TextField label="Ubicación (opcional)" placeholder="ej. Sala 204" {...register('location')} />
            <TextField label="Fecha" type="date" {...register('startDate')} />
            <Checkbox label="Incluir hora de inicio" {...register('hasStartTime')} />
            {hasStartTime && (
                <Controller
                    name="startTime"
                    control={control}
                    render={({ field }) => <TimeInput label="Hora inicio" value={field.value} onChange={field.onChange} />}
                />
            )}
            <Checkbox label="Incluir hora de término" {...register('hasEndTime')} />
            {hasEndTime && (
                <Controller
                    name="endTime"
                    control={control}
                    render={({ field }) => <TimeInput label="Hora término" value={field.value} onChange={field.onChange} />}
                />
            )}
            {isDeadlineEvent && !editingEvent && categoryId && <Checkbox label="Crear tarea" {...register('createTask')} />}
        </Modal>
    );
}
