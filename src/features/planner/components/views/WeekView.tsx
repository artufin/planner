'use client';

import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { useDndMonitor } from '@dnd-kit/core';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useEvents } from '@/lib/api/events';
import { useSchedule, useScheduleExceptions } from '@/lib/api/schedule';
import { useTasks } from '@/lib/api/tasks';
import { useTimeDivisions } from '@/lib/api/timeDivisions';
import { cx } from '@planner/ui';
import { getWeekStart, pad2, recurringForRange, timeToMinutes } from '../../utils';
import { useNowMinutes, useToday } from '../../useToday';
import BacklogTray from '../BacklogTray';
import { buildWeek } from './week/model';
import { noteDragEnd } from './week/dragState';
import { useWeekTrayOpen } from '../../useWeekTray';
import { WeekDayColumn } from './week/WeekDayColumn';
import { WeekStripDay } from './week/WeekStripDay';
import s from './WeekView.module.css';

/** Hour labels are 12px tall; a time-division label closer than this to one would collide with it. */
const LABEL_CLEARANCE = 14;

/** Nearest scrolling ancestor — the grid scrolls inside its own pane. */
function scrollParentOf(el: HTMLElement): HTMLElement | null {
    let node = el.parentElement;
    while (node) {
        const { overflowY } = getComputedStyle(node);
        if (overflowY === 'auto' || overflowY === 'scroll') return node;
        node = node.parentElement;
    }
    return null;
}

export default function WeekView() {
    const { data: categories = [] } = useCategories();
    const { data: events = [] } = useEvents();
    const { data: tasks = [] } = useTasks();
    const { data: schedule = [] } = useSchedule();
    const { data: scheduleExceptions = [] } = useScheduleExceptions();
    const { data: timeDivisions = [] } = useTimeDivisions();
    const weekOffset = usePlannerStore((st) => st.weekOffset);
    const weekZoom = usePlannerStore((st) => st.weekZoom);
    const today = useToday();
    const nowMinutes = useNowMinutes();
    const [trayOpen, setTrayOpen] = useWeekTrayOpen();

    useDndMonitor({ onDragEnd: noteDragEnd, onDragCancel: noteDragEnd });

    const headRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    /**
     * On mount, scroll the grid to 07:00 — or, on the current week, far enough
     * that "now" is in view — instead of starting at midnight.
     */
    useLayoutEffect(() => {
        const body = bodyRef.current;
        const scroller = body && scrollParentOf(body);
        if (!body || !scroller) return;
        const { weekZoom: zoom, weekOffset: offset } = usePlannerStore.getState();
        const headHeight = headRef.current?.offsetHeight ?? 0;
        const visibleMinutes = ((scroller.clientHeight - headHeight) / zoom) * 60;
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        let target = 7 * 60;
        if (offset === 0) {
            if (nowMin < target) target = Math.max(0, nowMin - 60);
            else if (nowMin > target + visibleMinutes - 60) target = nowMin - 120;
        }
        const bodyTop = body.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
        scroller.scrollTop = Math.max(0, bodyTop + (target / 60) * zoom - headHeight - 6);
    }, []);

    // React Compiler memoizes these derivations; no manual useMemo needed.
    const weekStart = getWeekStart(today, weekOffset);
    const recurring = recurringForRange(schedule, categories, weekStart, 7, scheduleExceptions);
    const days = buildWeek({
        weekStart,
        today,
        events,
        tasks,
        categories,
        recurring,
        exceptions: scheduleExceptions,
        zoom: weekZoom,
    });

    const ppm = weekZoom / 60;
    const hourLabels = Array.from({ length: 23 }, (_, i) => i + 1);
    /** The user's time divisions (class periods): a ruled line across the paper, labelled in the margin when off the hour. */
    const divisionMinutes = [...new Set(timeDivisions.map((t) => timeToMinutes(t.value)))].sort((a, b) => a - b);
    const divisionTops = divisionMinutes.map((m) => m * ppm);
    const divisionLabels = divisionMinutes.filter((m) => {
        const offHour = m % 60;
        return offHour !== 0 && Math.min(offHour, 60 - offHour) * ppm >= LABEL_CLEARANCE;
    });

    /** The now line belongs only on the week that actually contains today. */
    const showNowLine = weekOffset === 0 && nowMinutes !== null;
    const nowTop = (nowMinutes ?? 0) * ppm;
    const nowLabel = nowMinutes === null ? '' : `${pad2(Math.floor(nowMinutes / 60))}:${pad2(nowMinutes % 60)}`;
    const todayColumn = (today.getDay() + 6) % 7;

    const paperStyle = { '--hour': `${weekZoom}px`, height: 24 * weekZoom } as CSSProperties;

    return (
        <div className={s.root}>
            <div className={s.scroller}>
                <div className={s.sheet}>
                    {/* The day names and the "sin hora" strip stay frozen at the top while the hours scroll. */}
                    <div ref={headRef} className={s.frozen}>
                        <div className={cx(s.cols, s.head)}>
                            <div className={s.headGutter} />
                            {days.map((day) => (
                                <div key={day.dateIso} className={cx(s.headDay, day.isToday && s.headToday, day.isPast && s.headPast)}>
                                    <span className={cx('pl-display', s.headNum, day.isToday && 'pl-marker')}>{day.dayNum}</span>
                                    <span className={s.headLabel}>{day.isToday ? 'hoy' : day.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className={cx(s.cols, s.strip)}>
                            <div className={s.stripGutter}>sin hora</div>
                            {days.map((day, i) => (
                                <WeekStripDay key={day.dateIso} day={day} alignEnd={i >= 5} />
                            ))}
                        </div>
                    </div>

                    <div ref={bodyRef} className={cx(s.cols, s.body)}>
                        <div className={s.gutter}>
                            {hourLabels.map((h) => (
                                <div key={h} className={s.hourLabel} style={{ top: h * weekZoom - 6 }}>
                                    {pad2(h)}:00
                                </div>
                            ))}
                            {divisionLabels.map((m) => (
                                <div key={m} className={s.divisionLabel} style={{ top: m * ppm - 6 }}>
                                    {pad2(Math.floor(m / 60))}:{pad2(m % 60)}
                                </div>
                            ))}
                            {divisionTops.map((top) => (
                                <div key={top} className={s.divisionTick} style={{ top }} />
                            ))}
                        </div>
                        {days.map((day, i) => (
                            <WeekDayColumn
                                key={day.dateIso}
                                day={day}
                                zoom={weekZoom}
                                alignEnd={i >= 5}
                                divisionTops={divisionTops}
                                paperStyle={paperStyle}
                            />
                        ))}

                        {showNowLine && (
                            <div className={s.now} style={{ top: nowTop, '--today': todayColumn } as CSSProperties} aria-hidden="true">
                                <div className={s.nowLabel}>{nowLabel}</div>
                                <div className={s.nowTrack} />
                                <div className={s.nowToday} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {trayOpen && <BacklogTray className={s.tray} onClose={() => setTrayOpen(false)} />}
        </div>
    );
}
