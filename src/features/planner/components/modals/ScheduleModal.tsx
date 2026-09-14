'use client';

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useSchedule, useScheduleExceptions, useCreateScheduleItem, useUpdateScheduleItem, useDeleteScheduleItem, useUpsertScheduleException } from '@/lib/api/schedule';
import { apiErrorMessage } from '@/lib/api/http';
import { scheduleFormSchema, scheduleOccurrenceFormSchema, type ScheduleFormValues, type ScheduleOccurrenceFormValues } from '../../schemas';
import { MONTH_NAMES, WEEKDAY_OPTIONS } from '../../constants';
import { checkboxLabelStyle, closeButtonStyle, dangerButtonStyle, inputStyle, labelStyle, modalCardStyle, modalHeaderStyle, modalOverlayStyle, modalTitleStyle, primaryButtonStyle } from '../../styles';
import { categoryById, dateToInput, inputToDate, scheduleTitleFor } from '../../utils';
import type { ScheduleItem } from '@/lib/api/types';
import { TimeInput } from '../TimeInput';

const errorTextStyle = { fontSize: 11, color: 'oklch(55% 0.18 25)', marginTop: 3 };
const linkButtonStyle = { border: 'none', background: 'none', padding: 0, fontSize: 11.5, fontWeight: 600, color: 'oklch(50% 0.01 95)', textDecoration: 'underline', cursor: 'pointer' } as const;

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
        <div style={modalOverlayStyle}>
            <form onSubmit={handleSubmit(onSubmit)} style={{ ...modalCardStyle, width: 340 }}>
                <div style={modalHeaderStyle}>
                    <div style={modalTitleStyle}>{scheduleTitleFor(item, category)}</div>
                    <button type="button" onClick={closeScheduleModal} style={closeButtonStyle} aria-label="Cerrar">×</button>
                </div>
                <div style={{ fontSize: 11.5, color: 'oklch(55% 0.01 95)', marginTop: -8 }}>
                    {d} de {MONTH_NAMES[m]} de {y} · solo esta clase
                </div>
                <div>
                    <div style={labelStyle}>Título (opcional)</div>
                    <input {...register('title')} placeholder="Si se deja vacío, se usa el nombre de la categoría" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                        <div style={labelStyle}>Hora inicio</div>
                        <Controller name="start" control={control} render={({ field }) => <TimeInput value={field.value} onChange={field.onChange} style={inputStyle} />} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={labelStyle}>Hora término</div>
                        <Controller name="end" control={control} render={({ field }) => <TimeInput value={field.value} onChange={field.onChange} style={inputStyle} />} />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                    <button
                        type="button"
                        onClick={() =>
                            upsertException.mutate(
                                { scheduleId: item.id, date, cancelled: true },
                                { onSuccess: closeScheduleModal, onError },
                            )
                        }
                        style={dangerButtonStyle}
                    >
                        Eliminar esta clase
                    </button>
                    <button type="submit" style={primaryButtonStyle}>Guardar</button>
                </div>
                <button type="button" onClick={() => openScheduleModalEdit(item.id)} style={{ ...linkButtonStyle, alignSelf: 'center' }}>
                    Editar todo el horario en vez de esta clase
                </button>
            </form>
        </div>
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
        <div style={modalOverlayStyle}>
            <form onSubmit={handleSubmit(onSubmit)} style={{ ...modalCardStyle, width: 340 }}>
                <div style={modalHeaderStyle}>
                    <div style={modalTitleStyle}>{editingSchedule ? 'Editar clase' : 'Agregar horario'}</div>
                    <button type="button" onClick={closeScheduleModal} style={closeButtonStyle} aria-label="Cerrar">×</button>
                </div>
                <input type="hidden" {...register('categoryId')} />
                <div>
                    <div style={labelStyle}>Título (opcional)</div>
                    <input {...register('title')} placeholder="Si se deja vacío, se usa el nombre de la categoría" style={inputStyle} />
                </div>
                <div>
                    <div style={labelStyle}>Día de la semana</div>
                    <select {...register('weekday', { valueAsNumber: true })} style={inputStyle}>
                        {WEEKDAY_OPTIONS.map((w) => (
                            <option key={w.value} value={w.value}>{w.label}</option>
                        ))}
                    </select>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                        <div style={labelStyle}>Hora inicio</div>
                        <Controller name="start" control={control} render={({ field }) => <TimeInput value={field.value} onChange={field.onChange} style={inputStyle} />} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={labelStyle}>Hora término</div>
                        <Controller name="end" control={control} render={({ field }) => <TimeInput value={field.value} onChange={field.onChange} style={inputStyle} />} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                        <div style={labelStyle}>Fecha de inicio</div>
                        <input type="date" {...register('startDate')} style={inputStyle} />
                        {errors.startDate && <div style={errorTextStyle}>{errors.startDate.message}</div>}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={labelStyle}>Fecha de término</div>
                        <input type="date" {...register('endDate')} style={inputStyle} />
                        {errors.endDate && <div style={errorTextStyle}>{errors.endDate.message}</div>}
                    </div>
                </div>
                <label style={checkboxLabelStyle}>
                    <input type="checkbox" {...register('biweekly')} />
                    Repetir cada 2 semanas
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                    {editingSchedule ? (
                        <button
                            type="button"
                            onClick={() =>
                                deleteScheduleItem.mutate(editingSchedule.id, {
                                    onSuccess: closeScheduleModal,
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

export default function ScheduleModal() {
    const { data: schedule = [] } = useSchedule();
    const scheduleModal = usePlannerStore((s) => s.scheduleModal);

    const editingSchedule = scheduleModal.editingId ? schedule.find((s) => s.id === scheduleModal.editingId) : undefined;

    if (editingSchedule && scheduleModal.occurrenceDate) {
        return <ScheduleOccurrenceModal item={editingSchedule} date={scheduleModal.occurrenceDate} />;
    }
    return <ScheduleSeriesModal editingSchedule={editingSchedule} presetCategoryId={scheduleModal.presetCategoryId} />;
}
