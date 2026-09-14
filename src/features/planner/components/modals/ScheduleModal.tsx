'use client';

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Checkbox, Modal, SelectField, TextField, TimeInput } from '@planner/ui';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useSchedule, useScheduleExceptions, useCreateScheduleItem, useUpdateScheduleItem, useDeleteScheduleItem, useUpsertScheduleException } from '@/lib/api/schedule';
import { apiErrorMessage } from '@/lib/api/http';
import { scheduleFormSchema, scheduleOccurrenceFormSchema, type ScheduleFormValues, type ScheduleOccurrenceFormValues } from '../../schemas';
import { MONTH_NAMES, WEEKDAY_OPTIONS } from '../../constants';
import { categoryById, dateToInput, inputToDate, scheduleTitleFor } from '../../utils';
import type { ScheduleItem } from '@/lib/api/types';

const linkButtonStyle = {
    alignSelf: 'center',
    border: 'none',
    background: 'none',
    padding: 0,
    fontSize: 11.5,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: 'var(--pl-color-label)',
    textDecoration: 'underline',
    cursor: 'pointer',
} as const;

function ScheduleOccurrenceModal({ item, date }: { item: ScheduleItem; date: string }) {
    const { data: categories = [] } = useCategories();
    const { data: scheduleExceptions = [] } = useScheduleExceptions();
    const closeScheduleModal = usePlannerStore((s) => s.closeScheduleModal);
    const upsertException = useUpsertScheduleException();
    const openScheduleModalEdit = usePlannerStore((s) => s.openScheduleModalEdit);

    const category = categoryById(categories, item.categoryId)!;
    const exception = scheduleExceptions.find((e) => e.scheduleId === item.id && e.date === date);
    const { y, m, d } = inputToDate(date);

    const defaultValues = useMemo<ScheduleOccurrenceFormValues>(
        () => ({
            title: exception?.title ?? item.title,
            start: exception?.start ?? item.start,
            end: exception?.end ?? item.end,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const { register, handleSubmit, control } = useForm<ScheduleOccurrenceFormValues>({
        resolver: zodResolver(scheduleOccurrenceFormSchema),
        defaultValues,
    });

    const onError = (e: unknown) => window.alert(apiErrorMessage(e));

    const onSubmit = (values: ScheduleOccurrenceFormValues) =>
        upsertException.mutate(
            { scheduleId: item.id, date, cancelled: false, title: values.title.trim(), start: values.start, end: values.end },
            { onSuccess: closeScheduleModal, onError },
        );

    return (
        <Modal
            asForm
            width={340}
            title={scheduleTitleFor(item, category)}
            onClose={closeScheduleModal}
            onSubmit={handleSubmit(onSubmit)}
            footer={
                <>
                    <Button
                        variant="danger"
                        onClick={() =>
                            upsertException.mutate({ scheduleId: item.id, date, cancelled: true }, { onSuccess: closeScheduleModal, onError })
                        }
                    >
                        Eliminar esta clase
                    </Button>
                    <Button type="submit">Guardar</Button>
                </>
            }
        >
            <div style={{ fontSize: 11.5, color: 'var(--pl-color-muted)', marginTop: -8 }}>
                {d} de {MONTH_NAMES[m]} de {y} · solo esta clase
            </div>
            <TextField
                label="Título (opcional)"
                placeholder="Si se deja vacío, se usa el nombre de la categoría"
                {...register('title')}
            />
            <div style={{ display: 'flex', gap: 'var(--pl-space-lg)' }}>
                <div style={{ flex: 1 }}>
                    <Controller
                        name="start"
                        control={control}
                        render={({ field }) => <TimeInput label="Hora inicio" value={field.value} onChange={field.onChange} />}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <Controller
                        name="end"
                        control={control}
                        render={({ field }) => <TimeInput label="Hora término" value={field.value} onChange={field.onChange} />}
                    />
                </div>
            </div>
            <button type="button" onClick={() => openScheduleModalEdit(item.id)} style={linkButtonStyle}>
                Editar todo el horario en vez de esta clase
            </button>
        </Modal>
    );
}

function ScheduleSeriesModal({ editingSchedule, presetCategoryId }: { editingSchedule: ScheduleItem | undefined; presetCategoryId: string | null }) {
    const { data: categories = [] } = useCategories();
    const closeScheduleModal = usePlannerStore((s) => s.closeScheduleModal);
    const createScheduleItem = useCreateScheduleItem();
    const updateScheduleItem = useUpdateScheduleItem();
    const deleteScheduleItem = useDeleteScheduleItem();

    const defaultValues = useMemo<ScheduleFormValues>(() => {
        if (editingSchedule) {
            return {
                categoryId: editingSchedule.categoryId,
                title: editingSchedule.title,
                weekday: editingSchedule.weekday,
                start: editingSchedule.start,
                end: editingSchedule.end,
                startDate: editingSchedule.startDate,
                endDate: editingSchedule.endDate ?? '',
                biweekly: editingSchedule.interval === 2,
            };
        }
        const today = dateToInput(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        return { categoryId: presetCategoryId ?? categories[0]?.id ?? '', title: '', weekday: 1, start: '09:00', end: '10:30', startDate: today, endDate: '', biweekly: false };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { register, handleSubmit, control, formState: { errors } } = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleFormSchema),
        defaultValues,
    });

    const onSubmit = (values: ScheduleFormValues) => {
        const onError = (e: unknown) => window.alert(apiErrorMessage(e));
        const payload = {
            categoryId: values.categoryId,
            title: values.title.trim(),
            weekday: values.weekday,
            start: values.start,
            end: values.end,
            startDate: values.startDate,
            endDate: values.endDate || null,
            interval: (values.biweekly ? 2 : 1) as 1 | 2,
        };
        if (editingSchedule) {
            updateScheduleItem.mutate({ id: editingSchedule.id, ...payload }, { onSuccess: closeScheduleModal, onError });
        } else {
            createScheduleItem.mutate(payload, { onSuccess: closeScheduleModal, onError });
        }
    };

    return (
        <Modal
            asForm
            width={340}
            title={editingSchedule ? 'Editar clase' : 'Agregar horario'}
            onClose={closeScheduleModal}
            onSubmit={handleSubmit(onSubmit)}
            footer={
                <>
                    {editingSchedule ? (
                        <Button
                            variant="danger"
                            onClick={() =>
                                deleteScheduleItem.mutate(editingSchedule.id, {
                                    onSuccess: closeScheduleModal,
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
            <input type="hidden" {...register('categoryId')} />
            <TextField
                label="Título (opcional)"
                placeholder="Si se deja vacío, se usa el nombre de la categoría"
                {...register('title')}
            />
            <SelectField
                label="Día de la semana"
                options={WEEKDAY_OPTIONS.map((w) => ({ value: String(w.value), label: w.label }))}
                {...register('weekday', { valueAsNumber: true })}
            />
            <div style={{ display: 'flex', gap: 'var(--pl-space-lg)' }}>
                <div style={{ flex: 1 }}>
                    <Controller
                        name="start"
                        control={control}
                        render={({ field }) => <TimeInput label="Hora inicio" value={field.value} onChange={field.onChange} />}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <Controller
                        name="end"
                        control={control}
                        render={({ field }) => <TimeInput label="Hora término" value={field.value} onChange={field.onChange} />}
                    />
                </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--pl-space-lg)' }}>
                <div style={{ flex: 1 }}>
                    <TextField label="Fecha de inicio" type="date" error={errors.startDate?.message} {...register('startDate')} />
                </div>
                <div style={{ flex: 1 }}>
                    <TextField label="Fecha de término" type="date" error={errors.endDate?.message} {...register('endDate')} />
                </div>
            </div>
            <Checkbox label="Repetir cada 2 semanas" {...register('biweekly')} />
        </Modal>
    );
}

export default function ScheduleModal() {
    const { data: schedule = [] } = useSchedule();
    const scheduleModal = usePlannerStore((s) => s.scheduleModal);

    const editingSchedule = scheduleModal.editingId ? schedule.find((s) => s.id === scheduleModal.editingId) : undefined;

    if (editingSchedule && scheduleModal.occurrenceDate) {
        return <ScheduleOccurrenceModal item={editingSchedule} date={scheduleModal.occurrenceDate} />;
    }
    return <ScheduleSeriesModal editingSchedule={editingSchedule} presetCategoryId={scheduleModal.presetCategoryId} />;
}
