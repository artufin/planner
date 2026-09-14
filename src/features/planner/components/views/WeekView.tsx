'use client';

import { useMemo, useState } from 'react';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useEvents } from '@/lib/api/events';
import { useSchedule, useScheduleExceptions } from '@/lib/api/schedule';
import { useTimeDivisions } from '@/lib/api/timeDivisions';
import { AllDayBar } from '../AllDayBar';
import { colors } from '../../styles';
import { WEEKDAY_LABELS } from '../../constants';
import {
    categoryById,
    dateToInput,
    eventsForDate,
    getWeekStart,
    isMultiDay,
    isOvernightEvent,
    recurringForRange,
    sameDate,
    scheduleTitleFor,
    softColor,
    softTextColor,
    solidColor,
    timeToMinutes,
} from '../../utils';
import { useToday } from '../../useToday';

interface AllDayBar {
    id: string;
    title: string;
    hue: number;
    roundLeft: boolean;
    roundRight: boolean;
}

interface DayColumnEvent {
    key: string;
    isLine: boolean;
    title: string;
    subtitle?: string;
    hue: number;
    top: number;
    height?: number;
    timeLabel?: string;
    clickable: boolean;
    onClick?: () => void;
}

interface DayColumn {
    label: string;
    dayNum: number;
    isToday: boolean;
    events: DayColumnEvent[];
}

export default function WeekView() {
    const { data: categories = [] } = useCategories();
    const { data: events = [] } = useEvents();
    const { data: schedule = [] } = useSchedule();
    const { data: scheduleExceptions = [] } = useScheduleExceptions();
    const { data: timeDivisions = [] } = useTimeDivisions();
    const weekOffset = usePlannerStore((s) => s.weekOffset);
    const weekZoom = usePlannerStore((s) => s.weekZoom);
    const openEventModalEdit = usePlannerStore((s) => s.openEventModalEdit);
    const openScheduleModalOccurrence = usePlannerStore((s) => s.openScheduleModalOccurrence);
    const today = useToday();
    const [hoverBarId, setHoverBarId] = useState<string | null>(null);

    const weekStart = useMemo(() => getWeekStart(today, weekOffset), [today, weekOffset]);
    const recurringWeek = useMemo(
        () => recurringForRange(schedule, categories, weekStart, 7, scheduleExceptions),
        [schedule, categories, weekStart, scheduleExceptions],
    );

    const weekAllDay = useMemo(() => {
        const out: { bars: AllDayBar[] }[] = [];
        for (let i = 0; i < 7; i++) {
            const dt = new Date(weekStart);
            dt.setDate(weekStart.getDate() + i);
            const dateIso = dateToInput(dt.getFullYear(), dt.getMonth(), dt.getDate());
            const multiEvents = eventsForDate(events, categories, dateIso).filter(
                (ev) => isMultiDay(ev) && !isOvernightEvent(ev),
            );
            out.push({
                bars: multiEvents.map((ev) => {
                    const c = categoryById(categories, ev.categoryId)!;
                    const isStart = ev.startDate === dateIso;
                    const isEnd = ev.endDate === dateIso;
                    return { id: ev.id, title: ev.title, hue: c.hue, roundLeft: isStart || i === 0, roundRight: isEnd || i === 6 };
                }),
            });
        }
        return out;
    }, [weekStart, events, categories]);
    const hasAllDayEvents = weekAllDay.some((d) => d.bars.length > 0);

    const weekDays: DayColumn[] = useMemo(() => {
        const out: DayColumn[] = [];
        for (let i = 0; i < 7; i++) {
            const dt = new Date(weekStart);
            dt.setDate(weekStart.getDate() + i);
            const dateIso = dateToInput(dt.getFullYear(), dt.getMonth(), dt.getDate());
            const dayAllEvents = eventsForDate(events, categories, dateIso);
            const singleEvents = dayAllEvents.filter((ev) => !isMultiDay(ev) || isOvernightEvent(ev));
            const dayRecurring = recurringWeek.filter((ev) => ev.y === dt.getFullYear() && ev.m === dt.getMonth() && ev.d === dt.getDate());
            const dayEvents = [...dayRecurring, ...singleEvents];

            const columnEvents: DayColumnEvent[] = dayEvents.map((ev) => {
                const c = categoryById(categories, ev.categoryId)!;
                const isSchedule = 'scheduleId' in ev;
                const title = isSchedule ? scheduleTitleFor(ev, c) : ev.title;
                const subtitle = isSchedule && ev.title.trim() ? c.name : undefined;
                const hasStart = ev.start !== null;
                const hasEnd = ev.end !== null;
                const isLineOnly = !isSchedule && !hasStart && hasEnd;
                const onClick = isSchedule
                    ? () => openScheduleModalOccurrence(ev.scheduleId, dateIso)
                    : () => openEventModalEdit(ev.id);
                if (isLineOnly) {
                    const endMin = timeToMinutes(ev.end);
                    return {
                        key: ev.id,
                        isLine: true,
                        title,
                        hue: c.hue,
                        top: Math.max(0, (endMin / 60) * weekZoom),
                        clickable: true,
                        onClick,
                    };
                }
                let startMin: number;
                let endMin: number;
                let timeLabel: string;
                if (!isSchedule && isOvernightEvent(ev)) {
                    const isStartDay = ev.startDate === dateIso;
                    if (isStartDay) {
                        startMin = timeToMinutes(ev.start);
                        endMin = 24 * 60;
                        timeLabel = `${ev.start} →`;
                    } else {
                        startMin = 0;
                        endMin = timeToMinutes(ev.end);
                        timeLabel = `→ ${ev.end}`;
                    }
                } else {
                    startMin = hasStart ? timeToMinutes(ev.start) : 8 * 60;
                    endMin = hasEnd ? timeToMinutes(ev.end) : hasStart ? startMin + 40 : 8 * 60 + 40;
                    timeLabel = !hasStart && !hasEnd ? 'Sin horario' : hasStart && hasEnd ? `${ev.start}–${ev.end}` : hasStart ? (ev.start ?? '') : `hasta ${ev.end}`;
                }
                const top = Math.max(0, (startMin / 60) * weekZoom);
                const height = Math.max(20, ((endMin - startMin) / 60) * weekZoom - 2);
                return { key: ev.id, isLine: false, title, subtitle, hue: c.hue, top, height, timeLabel, clickable: true, onClick };
            });

            out.push({
                label: WEEKDAY_LABELS[i],
                dayNum: dt.getDate(),
                isToday: sameDate(dt, today),
                events: columnEvents,
            });
        }
        return out;
    }, [weekStart, events, categories, recurringWeek, weekZoom, today, openEventModalEdit, openScheduleModalOccurrence]);

    const sortedDivisions = useMemo(
        () => [...timeDivisions].sort((a, b) => timeToMinutes(a.value) - timeToMinutes(b.value)),
        [timeDivisions],
    );
    const hourLabels = sortedDivisions.map((t) => ({ label: t.value, top: (timeToMinutes(t.value) / 60) * weekZoom - 6 }));
    const divisionLines = sortedDivisions.map((t) => ({ top: (timeToMinutes(t.value) / 60) * weekZoom }));

    const gridCols = '56px repeat(7,1fr)';

    return (
        <div style={{ minWidth: 820 }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: gridCols,
                    borderBottom: `1px solid ${colors.border}`,
                    position: 'sticky',
                    top: 0,
                    background: colors.pageBg,
                    zIndex: 2,
                }}
            >
                <div />
                {weekDays.map((day, i) => (
                    <div key={i} style={{ padding: '10px 8px', textAlign: 'center', borderLeft: `1px solid ${colors.border}` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: colors.muted }}>{day.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: day.isToday ? colors.accent : 'oklch(30% 0.01 95)' }}>
                            {day.dayNum}
                        </div>
                    </div>
                ))}
            </div>

            {hasAllDayEvents && (
                <div style={{ display: 'grid', gridTemplateColumns: gridCols, borderBottom: `1px solid ${colors.border}`, padding: '5px 0' }}>
                    <div />
                    {weekAllDay.map((day, i) => (
                        <div key={i} style={{ padding: '0 3px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {day.bars.map((b) => (
                                <AllDayBar
                                    key={b.id}
                                    bar={b}
                                    hovered={hoverBarId === b.id}
                                    onClick={() => openEventModalEdit(b.id)}
                                    onMouseEnter={() => setHoverBarId(b.id)}
                                    onMouseLeave={() => setHoverBarId(null)}
                                    outerStyle={{
                                        position: 'relative',
                                        height: 8,
                                        margin: `0 ${b.roundLeft ? '0' : '-3px'} 0 ${b.roundLeft ? '0' : '-3px'}`,
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: gridCols, position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                    {hourLabels.map((h, i) => (
                        <div key={i} style={{ position: 'absolute', top: h.top, right: 8, fontSize: 10.5, color: colors.mutedLight }}>
                            {h.label}
                        </div>
                    ))}
                </div>
                {weekDays.map((day, i) => (
                    <div key={i} style={{ position: 'relative', borderLeft: `1px solid ${colors.border}`, height: 24 * weekZoom }}>
                        {divisionLines.map((dl, j) => (
                            <div key={j} style={{ position: 'absolute', left: 0, right: 0, top: dl.top, height: 1, background: 'oklch(93% 0.004 95)' }} />
                        ))}
                        {day.events.map((ev) =>
                            ev.isLine ? (
                                <div
                                    key={ev.key}
                                    onClick={ev.onClick}
                                    style={{ position: 'absolute', left: 3, right: 3, top: ev.top - 14, cursor: 'pointer' }}
                                >
                                    <div
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            lineHeight: '12px',
                                            marginBottom: 2,
                                            color: solidColor(ev.hue),
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {ev.title}
                                    </div>
                                    <div style={{ width: '100%', height: 3, background: solidColor(ev.hue), borderRadius: 2 }} />
                                </div>
                            ) : (
                                <div
                                    key={ev.key}
                                    onClick={ev.clickable ? ev.onClick : undefined}
                                    style={{
                                        position: 'absolute',
                                        left: 3,
                                        right: 3,
                                        top: ev.top,
                                        height: ev.height,
                                        background: softColor(ev.hue),
                                        color: softTextColor(ev.hue),
                                        borderLeft: `3px solid ${solidColor(ev.hue)}`,
                                        borderRadius: 6,
                                        padding: '4px 7px',
                                        overflow: 'hidden',
                                        cursor: ev.clickable ? 'pointer' : undefined,
                                    }}
                                >
                                    <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.25, overflow: 'hidden' }}>{ev.title}</div>
                                    {ev.subtitle && (
                                        <div
                                            style={{
                                                fontSize: 9.5,
                                                fontWeight: 600,
                                                opacity: 0.65,
                                                marginTop: 1,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {ev.subtitle}
                                        </div>
                                    )}
                                    <div style={{ fontSize: 10, opacity: 0.75, marginTop: 1 }}>{ev.timeLabel}</div>
                                </div>
                            ),
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
