'use client';

import { Button, IconButton, SegmentedControl, Swatch, colors } from '@planner/ui';
import { usePlannerStore } from '../store';
import { useCategories, useDeleteCategory } from '@/lib/api/categories';
import { apiErrorMessage } from '@/lib/api/http';
import { categoryById, getRangeLabel } from '../utils';
import { useToday } from '../useToday';

function NavArrows() {
    const goPrev = usePlannerStore((s) => s.goPrev);
    const goNext = usePlannerStore((s) => s.goNext);
    const goToday = usePlannerStore((s) => s.goToday);
    return (
        <>
            <IconButton aria-label="Anterior" onClick={goPrev}>‹</IconButton>
            <IconButton aria-label="Siguiente" onClick={goNext}>›</IconButton>
            <Button variant="secondary" size="sm" onClick={goToday}>Hoy</Button>
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
                        <Swatch hue={selectedCategory.hue} />
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
                {isCalendarView && <Button onClick={() => openEventModalNew()}>+ Agregar evento</Button>}
                {isCategoriesListView && <Button onClick={openCategoryModalNew}>+ Nueva categoría</Button>}
                {isCategoryView && selectedCategoryId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Button variant="secondary" size="sm" onClick={() => openCategoryModalEdit(selectedCategoryId)}>
                            Editar categoría
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                                if (window.confirm('¿Eliminar esta categoría y todos sus horarios/eventos/tareas?')) {
                                    deleteCategory.mutate(selectedCategoryId, {
                                        onSuccess: () => goToCategoriesList(),
                                        onError: (e) => window.alert(apiErrorMessage(e)),
                                    });
                                }
                            }}
                        >
                            Eliminar
                        </Button>
                    </div>
                )}
                {isWeekView && (
                    <SegmentedControl
                        ariaLabel="Zoom"
                        size="sm"
                        value={null}
                        onChange={(v) => (v === 'out' ? zoomOut() : zoomIn())}
                        options={[
                            { value: 'out', label: '−', ariaLabel: 'Alejar' },
                            { value: 'in', label: '+', ariaLabel: 'Acercar' },
                        ]}
                    />
                )}
                {isCalendarView && (
                    <SegmentedControl
                        ariaLabel="Vista"
                        value={isMonthView ? 'month' : 'week'}
                        onChange={(v) => (v === 'month' ? goToMonth() : goToWeek())}
                        options={[
                            { value: 'month', label: 'Calendario' },
                            { value: 'week', label: 'Semana' },
                        ]}
                    />
                )}
            </div>
        </div>
    );
}
