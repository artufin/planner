'use client';

import { useMemo, useState } from 'react';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useEvents } from '@/lib/api/events';
import { AllDayBar } from '../AllDayBar';
import { colors } from '../../styles';
import { NO_CATEGORY_LABEL, WEEKDAY_LABELS } from '../../constants';
import {
    appliesAsSingleDayEvent,
    categoryById,
    dateToInput,
    eventIsVisible,
    eventsForDate,
    getMonthAnchor,
    isMultiDay,
    isOvernightEvent,
    isoDval,
    sameDate,
    softColor,
    softTextColor,
    timeToMinutes,
} from '../../utils';
import { useToday } from '../../useToday';
import type { Category, PlannerEvent } from '@/lib/api/types';

interface CellItem {
    id: string;
    label: string;
    hue: number | null;
}

interface Cell {
    dayNum: number;
    dateIso: string;
    inMonth: boolean;
    isToday: boolean;
    items: CellItem[];
    hasMore: boolean;
    moreCount: number;
    itemsMarginTop: number;
}

interface Bar {
    id: string;
    title: string;
    subtitle: string;
    hue: number | null;
    startCol: number;
    endCol: number;
    roundLeft: boolean;
    roundRight: boolean;
    top: number;
}

interface Week {
    cells: Cell[];
    bars: Bar[];
}

function buildMonthWeeks(categories: Category[], events: PlannerEvent[], today: Date, monthOffset: number): Week[] {
    const md = getMonthAnchor(today, monthOffset);
    const year = md.getFullYear();
    const month = md.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - startWeekday);

    const weeks: Week[] = [];
    for (let w = 0; w < 6; w++) {
        const rowStart = new Date(gridStart);
        rowStart.setDate(gridStart.getDate() + w * 7);
        const rowEnd = new Date(rowStart);
        rowEnd.setDate(rowStart.getDate() + 6);

        const cells: Cell[] = [];
        for (let col = 0; col < 7; col++) {
            const dt = new Date(rowStart);
            dt.setDate(rowStart.getDate() + col);
            const inMonth = dt.getMonth() === month;
            const isToday = sameDate(dt, today);
            const dateIso = dateToInput(dt.getFullYear(), dt.getMonth(), dt.getDate());
            const dayEvents = eventsForDate(events, categories, dateIso)
                .filter((ev) => appliesAsSingleDayEvent(ev, dateIso))
                .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
            const items = dayEvents.slice(0, 2).map((ev) => ({
                id: ev.id,
                label: ev.title,
                hue: categoryById(categories, ev.categoryId)?.hue ?? null,
            }));
            cells.push({
                dayNum: dt.getDate(),
                dateIso,
                inMonth,
                isToday,
                items,
                hasMore: dayEvents.length > 2,
                moreCount: dayEvents.length - 2,
                itemsMarginTop: 4,
            });
        }

        const multiEventsThisRow = events.filter(
            (ev) =>
                isMultiDay(ev) &&
                !isOvernightEvent(ev) &&
                eventIsVisible(ev, categories) &&
                isoDval(ev.startDate) <= rowEnd.getTime() &&
                isoDval(ev.endDate) >= rowStart.getTime(),
        );
        const itemsMarginTop = multiEventsThisRow.length ? 16 + multiEventsThisRow.length * 8 : 4;
        cells.forEach((c) => {
            c.itemsMarginTop = itemsMarginTop;
        });

        const bars: Bar[] = multiEventsThisRow.map((ev, bi) => {
            const c = categoryById(categories, ev.categoryId);
            const startCol = Math.max(0, Math.round((isoDval(ev.startDate) - rowStart.getTime()) / 86400000));
            const endCol = Math.min(6, Math.round((isoDval(ev.endDate) - rowStart.getTime()) / 86400000));
            return {
                id: ev.id,
                title: ev.title,
                subtitle: [c?.name ?? NO_CATEGORY_LABEL, ev.location].filter(Boolean).join(' · '),
                hue: c?.hue ?? null,
                startCol,
                endCol,
                roundLeft: isoDval(ev.startDate) >= rowStart.getTime(),
                roundRight: isoDval(ev.endDate) <= rowEnd.getTime(),
                top: bi * 8,
            };
        });

        weeks.push({ cells, bars });
    }
    return weeks;
}

export default function MonthView() {
    const { data: categories = [] } = useCategories();
    const { data: events = [] } = useEvents();
    const monthOffset = usePlannerStore((s) => s.monthOffset);
    const openEventModalNew = usePlannerStore((s) => s.openEventModalNew);
    const openEventModalEdit = usePlannerStore((s) => s.openEventModalEdit);
    const today = useToday();
    const [hoverBarId, setHoverBarId] = useState<string | null>(null);

    const weeks = useMemo(() => buildMonthWeeks(categories, events, today, monthOffset), [categories, events, today, monthOffset]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', flex: 'none', borderBottom: `1px solid ${colors.border}` }}>
                {WEEKDAY_LABELS.map((wd) => (
                    <div
                        key={wd}
                        style={{
                            padding: '10px 12px',
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            color: colors.muted,
                            paddingTop: 2,
                            paddingBottom: 2,
                            textAlign: 'center',
                        }}
                    >
                        {wd}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {weeks.map((week, wi) => (
                    <div key={wi} style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', height: '100%' }}>
                            {week.cells.map((cell, ci) => (
                                <div
                                    key={ci}
                                    onDoubleClick={() => openEventModalNew(null, cell.dateIso)}
                                    style={{
                                        padding: '4px 5px',
                                        borderRight: `1px solid oklch(91% 0.004 95)`,
                                        borderBottom: `1px solid oklch(91% 0.004 95)`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2,
                                        overflow: 'hidden',
                                        minHeight: 0,
                                        background: cell.inMonth ? undefined : 'oklch(96.5% 0.003 95)',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            width: 19,
                                            height: 19,
                                            flex: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            background: cell.isToday ? colors.accent : undefined,
                                            color: cell.isToday ? '#fff' : cell.inMonth ? 'oklch(30% 0.01 95)' : 'oklch(65% 0.005 95)',
                                        }}
                                    >
                                        {cell.dayNum}
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 2,
                                            overflow: 'hidden',
                                            flex: 1,
                                            minHeight: 0,
                                            marginTop: cell.itemsMarginTop,
                                        }}
                                    >
                                        {cell.items.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    const ev = events.find((e) => e.id === item.id);
                                                    if (ev) openEventModalEdit(ev.id);
                                                }}
                                                onDoubleClick={(e) => e.stopPropagation()}
                                                style={{
                                                    flex: 'none',
                                                    lineHeight: '14px',
                                                    fontSize: 9.5,
                                                    fontWeight: 600,
                                                    padding: '1px 5px',
                                                    borderRadius: 4,
                                                    cursor: 'pointer',
                                                    background: softColor(item.hue),
                                                    color: softTextColor(item.hue),
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {item.label}
                                            </div>
                                        ))}
                                        {cell.hasMore && (
                                            <div style={{ flex: 'none', fontSize: 10, lineHeight: '12px', color: colors.muted, padding: '0 4px' }}>
                                                +{cell.moreCount} más
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ position: 'absolute', top: 20, left: 0, right: 0 }}>
                            {week.bars.map((b) => (
                                <AllDayBar
                                    key={b.id}
                                    bar={b}
                                    hovered={hoverBarId === b.id}
                                    onClick={() => openEventModalEdit(b.id)}
                                    onMouseEnter={() => setHoverBarId(b.id)}
                                    onMouseLeave={() => setHoverBarId(null)}
                                    outerStyle={{
                                        position: 'absolute',
                                        top: b.top,
                                        left: `calc(${b.startCol}/7*100%)`,
                                        width: `calc(${b.endCol - b.startCol + 1}/7*100% - 4px)`,
                                        marginLeft: 2,
                                        height: 8,
                                        pointerEvents: 'auto',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
