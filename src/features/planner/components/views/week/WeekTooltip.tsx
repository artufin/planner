import type { CSSProperties } from 'react';
import { cx, hueVars } from '@planner/ui';
import type { TipInfo } from './model';
import s from '../WeekView.module.css';

export function WeekTooltip({ info, className, style }: { info: TipInfo; className?: string; style?: CSSProperties }) {
    return (
        <div role="tooltip" className={cx(s.tip, className)} style={{ ...hueVars(info.hue), ...style } as CSSProperties}>
            <div className={s.tipTitle}>{info.title}</div>
            <div className={s.tipMeta}>
                <span className={s.tipDot} aria-hidden="true" />
                <span>{info.categoryName}</span>
            </div>
            {info.time && <div className={s.tipLine}>{info.time}</div>}
            {info.note && <div className={s.tipLine}>{info.note}</div>}
            {info.location && (
                <div className={s.tipLoc}>
                    <span className={s.tipPin} aria-hidden="true">
                        @
                    </span>
                    <span>{info.location}</span>
                </div>
            )}
        </div>
    );
}
