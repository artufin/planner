'use client';

import type { CSSProperties } from 'react';
import { usePlannerStore } from '../store';
import { colors } from '@planner/ui';

function navStyle(active: boolean): CSSProperties {
    return {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 8px',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13.5,
        fontWeight: 600,
        background: active ? colors.accentSoftBg : 'transparent',
        color: active ? colors.accentText : 'oklch(35% 0.01 95)',
    };
}

export default function Sidebar() {
    const view = usePlannerStore((s) => s.view);
    const goToMonth = usePlannerStore((s) => s.goToMonth);
    const goToPlanning = usePlannerStore((s) => s.goToPlanning);
    const goToCategoriesList = usePlannerStore((s) => s.goToCategoriesList);
    const goToSettings = usePlannerStore((s) => s.goToSettings);

    const isCalendarView = view === 'month' || view === 'week';
    const isCategoriesModuleView = view === 'categoriesList' || view === 'category';
    const isPlanningView = view === 'planning';
    const isSettingsView = view === 'settings';

    return (
        <div
            style={{
                width: 'max-content',
                flex: 'none',
                background: colors.sidebarBg,
                borderRight: `1px solid ${colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 14px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 22px' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: colors.accent, flex: 'none' }} />
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>Planner</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div onClick={goToMonth} style={navStyle(isCalendarView)}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: 'currentColor', flex: 'none' }} />
                    Calendario
                </div>
                <div onClick={goToPlanning} style={navStyle(isPlanningView)}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: 'currentColor', flex: 'none' }} />
                    Planificación
                </div>
                <div onClick={goToCategoriesList} style={navStyle(isCategoriesModuleView)}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: 'currentColor', flex: 'none' }} />
                    Categorías
                </div>
            </div>
            <div style={{ flex: 1 }} />
            <div
                onClick={goToSettings}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 8px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13.5,
                    fontWeight: 600,
                    borderTop: `1px solid ${colors.border}`,
                    marginTop: 8,
                    paddingTop: 14,
                    color: isSettingsView ? colors.accentText : 'oklch(35% 0.01 95)',
                }}
            >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: 'none' }}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Configuración
            </div>
        </div>
    );
}
