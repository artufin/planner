'use client';

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Checkbox, Modal, SelectField, TextField, TimeInput } from '@/components/ui';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, useDuplicateEvent } from '@/lib/api/events';
import { useCreateTask, useTasks, useUpdateTask } from '@/lib/api/tasks';
import type { PlannerEvent } from '@/lib/api/types';
import { toast } from '../../toast/toast';
import { eventFormSchema, type EventFormValues } from '../../schemas';
import { dateToInput, inputToDate, timeToMinutes } from '../../utils';
import s from './modal.module.css';

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
    const updateTask = useUpdateTask();
    const { data: tasks = [] } = useTasks();

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
    const startTime = watch('startTime');
    const endTime = watch('endTime');
    /** Mirrors utils.isDeadlineEvent: an end time with no start time reads as a due time rather than a scheduled block. */
    const isDeadlineEvent = !hasStartTime && hasEndTime;
    /** Display only — mirrors the overnight rule in onSubmit. */
    const endsNextDay = hasStartTime && hasEndTime && timeToMinutes(endTime) < timeToMinutes(startTime);

    const onSubmit = (values: EventFormValues) => {
        const onError = toast.error;
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

    /**
     * Deletes at once and offers the way back, instead of asking first. The DB
     * unlinks the event's tasks, so the undo re-creates the event (new id) and
     * links those tasks to it again.
     */
    const deleteWithUndo = (event: PlannerEvent) => {
        const { id, ...fields } = event;
        const linkedTaskIds = tasks.filter((t) => t.eventId === id).map((t) => t.id);
        closeEventModal();
        // mutateAsync: the modal is gone before the request settles, and mutate's callbacks die with it.
        const undo = async () => {
            const created = await createEvent.mutateAsync(fields);
            await Promise.all(linkedTaskIds.map((taskId) => updateTask.mutateAsync({ id: taskId, eventId: created.id })));
        };
        deleteEvent
            .mutateAsync(id)
            .then(() =>
                toast.show('Evento eliminado', {
                    label: 'Deshacer',
                    onAction: () => void undo().catch(toast.error),
                }),
            )
            .catch(toast.error);
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
                        <div className={s.footerStart}>
                            <Button variant="danger" onClick={() => deleteWithUndo(editingEvent)}>
                                Eliminar
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    duplicateEvent.mutate(editingEvent.id, {
                                        onSuccess: closeEventModal,
                                        onError: toast.error,
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
            <div className={s.row}>
                <SelectField
                    label="Categoría"
                    optional
                    placeholder="Sin categoría"
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    {...register('categoryId')}
                />
                <TextField label="Ubicación" optional placeholder="ej. Sala 204" {...register('location')} />
            </div>
            <div className={s.group} role="group" aria-labelledby="event-when">
                <p className={s.groupTitle} id="event-when">Cuándo</p>
                <TextField label="Fecha" type="date" {...register('startDate')} />
                <div className={s.row}>
                    <div className={s.toggleSlot}>
                        <Checkbox label="Hora de inicio" {...register('hasStartTime')} />
                        {hasStartTime && (
                            <Controller
                                name="startTime"
                                control={control}
                                render={({ field }) => (
                                    <TimeInput aria-label="Hora de inicio" value={field.value} onChange={field.onChange} />
                                )}
                            />
                        )}
                    </div>
                    <div className={s.toggleSlot}>
                        <Checkbox label="Hora de término" {...register('hasEndTime')} />
                        {hasEndTime && (
                            <Controller
                                name="endTime"
                                control={control}
                                render={({ field }) => (
                                    <TimeInput aria-label="Hora de término" value={field.value} onChange={field.onChange} />
                                )}
                            />
                        )}
                    </div>
                </div>
                {endsNextDay && <p className={s.note}>Termina al día siguiente.</p>}
                {isDeadlineEvent && (
                    <p className={s.note}>Solo con hora de término, el evento se guarda como una entrega con hora límite.</p>
                )}
                {isDeadlineEvent && !editingEvent && categoryId && (
                    <Checkbox label="Crear también una tarea para esta entrega" {...register('createTask')} />
                )}
            </div>
        </Modal>
    );
}
