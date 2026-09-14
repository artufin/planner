'use client';

import type { CSSProperties } from 'react';
import { usePlannerStore } from '../store';
import { useCategories, useDeleteCategory } from '@/lib/api/categories';
import { apiErrorMessage } from '@/lib/api/http';
import { colors, primaryButtonStyle, smallDangerButtonStyle, smallSecondaryButtonStyle } from '../styles';
import { categoryById, getRangeLabel, solidColor } from '../utils';
import { useToday } from '../useToday';

const navButtonStyle: CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 7,
    border: `1px solid ${colors.border}`,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    color: 'oklch(40% 0.01 95)',
};

const todayButtonStyle: CSSProperties = {
    height: 28,
    padding: '0 12px',
    borderRadius: 7,
    border: `1px solid ${colors.border}`,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 600,
    color: 'oklch(40% 0.01 95)',
};

function tabStyle(active: boolean): CSSProperties {
    return {
        height: 30,
        padding: '0 16px',
        border: 'none',
        borderRadius: 7,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        background: active ? '#fff' : 'transparent',
        color: active ? 'oklch(30% 0.01 95)' : 'oklch(50% 0.01 95)',
        boxShadow: active ? '0 1px 2px oklch(0% 0 0 / 0.06)' : 'none',
    };
}

function NavArrows() {
    const goPrev = usePlannerStore((s) => s.goPrev);
    const goNext = usePlannerStore((s) => s.goNext);
    const goToday = usePlannerStore((s) => s.goToday);
    return (
        <>
            <button onClick={goPrev} style={navButtonStyle}>‹</button>
            <button onClick={goNext} style={navButtonStyle}>›</button>
            <button onClick={goToday} style={todayButtonStyle}>Hoy</button>
        </>
    );
}

export default function TopBar() {
    const view = usePlannerStore((s) => s.view);
    const monthOffset = usePlannerStore((s) => s.monthOffset);
    const weekOffset = usePlannerStore((s) => s.weekOffset);
    const { data: categories = [] } = useCategories();
    const selectedCategoryId = usePlannerStore((s) => s.selectedCategoryId);
    const goToCategoriesList = usePlannerStore((s) => s.goToCategoriesList);
    const goToMonth = usePlannerStore((s) => s.goToMonth);
    const goToWeek = usePlannerStore((s) => s.goToWeek);
    const zoomIn = usePlannerStore((s) => s.zoomIn);
    const zoomOut = usePlannerStore((s) => s.zoomOut);
    const openEventModalNew = usePlannerStore((s) => s.openEventModalNew);
    const openCategoryModalNew = usePlannerStore((s) => s.openCategoryModalNew);
    const openCategoryModalEdit = usePlannerStore((s) => s.openCategoryModalEdit);
    const deleteCategory = useDeleteCategory();
    const today = useToday();

    const isMonthView = view === 'month';
    const isWeekView = view === 'week';
    const isCalendarView = isMonthView || isWeekView;
    const isCategoryView = view === 'category';
    const isCategoriesListView = view === 'categoriesList';
    const isPlanningView = view === 'planning';
    const isSettingsView = view === 'settings';

    const selectedCategory = isCategoryView ? categoryById(categories, selectedCategoryId) : undefined;
    const rangeLabel = getRangeLabel(view, today, monthOffset, weekOffset);

    return (
        <div
            style={{
                height: 46,
                flex: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                borderBottom: `1px solid ${colors.border}`,
                background: colors.pageBg,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {isCategoryView && selectedCategory && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div onClick={goToCategoriesList} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.muted }}>
                            Categorías /
                        </div>
                        <div style={{ width: 14, height: 14, borderRadius: 5, background: solidColor(selectedCategory.hue), flex: 'none' }} />
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedCategory.name}</div>
                    </div>
                )}
                {isCategoriesListView && <div style={{ fontSize: 15, fontWeight: 700 }}>Categorías</div>}
                {isSettingsView && <div style={{ fontSize: 15, fontWeight: 700 }}>Configuración</div>}
                {isCalendarView && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <NavArrows />
                        <div style={{ fontSize: 15, fontWeight: 700, marginLeft: 6, textTransform: 'capitalize' }}>{rangeLabel}</div>
                    </div>
                )}
                {isPlanningView && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <NavArrows />
                        <div style={{ fontSize: 15, fontWeight: 700, marginLeft: 6 }}>{rangeLabel}</div>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isCalendarView && (
                    <button onClick={() => openEventModalNew()} style={primaryButtonStyle}>+ Agregar evento</button>
                )}
                {isCategoriesListView && (
                    <button onClick={openCategoryModalNew} style={primaryButtonStyle}>+ Nueva categoría</button>
                )}
                {isCategoryView && selectedCategoryId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => openCategoryModalEdit(selectedCategoryId)} style={smallSecondaryButtonStyle}>
                            Editar categoría
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('¿Eliminar esta categoría y todos sus horarios/eventos/tareas?')) {
                                    deleteCategory.mutate(selectedCategoryId, {
                                        onSuccess: () => goToCategoriesList(),
                                        onError: (e) => window.alert(apiErrorMessage(e)),
                                    });
                                }
                            }}
                            style={smallDangerButtonStyle}
                        >
                            Eliminar
                        </button>
                    </div>
                )}
                {isWeekView && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: colors.controlBg, borderRadius: 9, padding: 3 }}>
                        <button onClick={zoomOut} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'oklch(40% 0.01 95)' }}>−</button>
                        <button onClick={zoomIn} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'oklch(40% 0.01 95)' }}>+</button>
                    </div>
                )}
                {isCalendarView && (
                    <div style={{ display: 'flex', alignItems: 'center', background: colors.controlBg, borderRadius: 9, padding: 3, gap: 2 }}>
                        <button onClick={goToMonth} style={tabStyle(isMonthView)}>Calendario</button>
                        <button onClick={goToWeek} style={tabStyle(isWeekView)}>Semana</button>
                    </div>
                )}
            </div>
        </div>
    );
}
