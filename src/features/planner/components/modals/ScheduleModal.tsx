'use client';

import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Checkbox, Modal, SelectField, TextField, TimeInput } from '@/components/ui';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useSchedule, useScheduleExceptions, useCreateScheduleItem, useUpdateScheduleItem, useDeleteScheduleItem, useUpsertScheduleException } from '@/lib/api/schedule';
import { toast } from '../../toast/toast';
import ConfirmDialog from '../ConfirmDialog';
import { plural } from '../views/subjectInsights';
import { scheduleFormSchema, scheduleOccurrenceFormSchema, type ScheduleFormValues, type ScheduleOccurrenceFormValues } from '../../schemas';
import { MONTH_NAMES, WEEKDAY_OPTIONS } from '../../constants';
import { categoryById, dateToInput, inputToDate, scheduleTitleFor } from '../../utils';
import type { ScheduleItem } from '@/lib/api/types';
import s from './modal.module.css';

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

    const onError = toast.error;

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
            <p className={s.subtitle}>
                Cambios solo para la clase del <strong>{d} de {MONTH_NAMES[m]} de {y}</strong>.
            </p>
            <TextField
                label="Título"
                optional
                placeholder="Si se deja vacío, se usa el nombre de la categoría"
                {...register('title')}
            />
            <div className={s.row}>
                <Controller
                    name="start"
                    control={control}
                    render={({ field }) => <TimeInput label="Inicio" value={field.value} onChange={field.onChange} />}
                />
                <Controller
                    name="end"
                    control={control}
                    render={({ field }) => <TimeInput label="Término" value={field.value} onChange={field.onChange} />}
                />
            </div>
            <button type="button" onClick={() => openScheduleModalEdit(item.id)} className={s.linkButton}>
                Editar todo el horario en vez de esta clase
            </button>
        </Modal>
    );
}

/** "cada lunes, de 09:00 a 10:30" — or "cada dos lunes" for a biweekly class. */
function seriesWhen(item: ScheduleItem): string {
    const weekday = WEEKDAY_OPTIONS.find((w) => w.value === item.weekday)?.label.toLowerCase() ?? '';
    return `${item.interval === 2 ? 'cada dos' : 'cada'} ${weekday}, de ${item.start} a ${item.end}`;
}

function ScheduleSeriesModal({ editingSchedule, presetCategoryId }: { editingSchedule: ScheduleItem | undefined; presetCategoryId: string | null }) {
    const { data: categories = [] } = useCategories();
    const closeScheduleModal = usePlannerStore((s) => s.closeScheduleModal);
    const createScheduleItem = useCreateScheduleItem();
    const updateScheduleItem = useUpdateScheduleItem();
    const deleteScheduleItem = useDeleteScheduleItem();
    const { data: scheduleExceptions = [] } = useScheduleExceptions();
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const editingCategory = editingSchedule ? categoryById(categories, editingSchedule.categoryId) : undefined;
    const editingTitle = editingSchedule ? (editingCategory ? scheduleTitleFor(editingSchedule, editingCategory) : editingSchedule.title) : '';
    const changedOccurrences = editingSchedule ? scheduleExceptions.filter((e) => e.scheduleId === editingSchedule.id).length : 0;

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
        const onError = toast.error;
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
        <>
            <Modal
                asForm
                width={340}
                closeOnEscape={!confirmingDelete}
                title={editingSchedule ? 'Editar clase' : 'Agregar horario'}
                onClose={closeScheduleModal}
                onSubmit={handleSubmit(onSubmit)}
                footer={
                    <>
                        {editingSchedule ? (
                            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
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
                    label="Título"
                    optional
                    placeholder="Si se deja vacío, se usa el nombre de la categoría"
                    {...register('title')}
                />
                <div className={s.group} role="group" aria-labelledby="schedule-week">
                    <p className={s.groupTitle} id="schedule-week">Horario</p>
                    <SelectField
                        label="Día"
                        options={WEEKDAY_OPTIONS.map((w) => ({ value: String(w.value), label: w.label }))}
                        {...register('weekday', { valueAsNumber: true })}
                    />
                    <div className={s.row}>
                        <Controller
                            name="start"
                            control={control}
                            render={({ field }) => <TimeInput label="Inicio" value={field.value} onChange={field.onChange} />}
                        />
                        <Controller
                            name="end"
                            control={control}
                            render={({ field }) => <TimeInput label="Término" value={field.value} onChange={field.onChange} />}
                        />
                    </div>
                    <Checkbox label="Repetir cada 2 semanas" {...register('biweekly')} />
                </div>
                <div className={s.group} role="group" aria-labelledby="schedule-span">
                    <p className={s.groupTitle} id="schedule-span">Durante</p>
                    <div className={s.row}>
                        <TextField label="Desde" type="date" error={errors.startDate?.message} {...register('startDate')} />
                        <TextField
                            label="Hasta"
                            optional
                            type="date"
                            hint="Vacía si no tiene fin."
                            error={errors.endDate?.message}
                            {...register('endDate')}
                        />
                    </div>
                </div>
            </Modal>
            {confirmingDelete && editingSchedule && (
                <ConfirmDialog
                    title="Eliminar horario"
                    confirmLabel="Eliminar horario"
                    pending={deleteScheduleItem.isPending}
                    onCancel={() => setConfirmingDelete(false)}
                    onConfirm={() =>
                        deleteScheduleItem.mutate(editingSchedule.id, { onSuccess: closeScheduleModal, onError: toast.error })
                    }
                >
                    <p>
                        Se eliminarán todas las clases de <strong>{editingTitle}</strong> de {seriesWhen(editingSchedule)}.
                    </p>
                    {changedOccurrences > 0 && (
                        <p>También se perderán los cambios que hiciste a {plural(changedOccurrences, 'clase puntual', 'clases puntuales')}.</p>
                    )}
                    <p>No se puede deshacer.</p>
                </ConfirmDialog>
            )}
        </>
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
