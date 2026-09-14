'use client';

import type { CSSProperties } from 'react';
import { solidColor } from '../utils';

export interface AllDayBarSegment {
    id: string;
    title: string;
    /** Null when the event has no category — the bar is drawn neutral gray. */
    hue: number | null;
    /** Optional second tooltip line, e.g. the event's category. */
    subtitle?: string | null;
    roundLeft: boolean;
    roundRight: boolean;
}

/** A thin colored bar for a multi-day event, with a hover tooltip showing its title — shared between MonthView's week rows and WeekView's all-day strip. */
export function AllDayBar({
    bar,
    outerStyle,
    hovered,
    onClick,
    onMouseEnter,
    onMouseLeave,
}: {
    bar: AllDayBarSegment;
    outerStyle: CSSProperties;
    hovered: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}) {
    return (
        <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer', ...outerStyle }}>
            <div
                style={{
                    width: '100%',
                    height: 4,
                    marginTop: 2,
                    background: solidColor(bar.hue),
                    borderRadius: `${bar.roundLeft ? 3 : 0}px ${bar.roundRight ? 3 : 0}px ${bar.roundRight ? 3 : 0}px ${bar.roundLeft ? 3 : 0}px`,
                }}
            />
            {hovered && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        marginBottom: 4,
                        background: 'oklch(20% 0.01 95)',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '3px 7px',
                        borderRadius: 5,
                        whiteSpace: 'nowrap',
                        zIndex: 5,
                    }}
                >
                    {bar.title}
                    {bar.subtitle && <div style={{ opacity: 0.7, fontWeight: 500 }}>{bar.subtitle}</div>}
                </div>
            )}
        </div>
    );
}
