'use client';

import { useState } from 'react';
import { Button, IconButton, SegmentedControl, Swatch, cx } from '@/components/ui';
import { usePlannerStore } from '../store';
import { useCategories } from '@/lib/api/categories';
import { useTasks } from '@/lib/api/tasks';
import { backlogTasks, categoryById, getRangeLabel } from '../utils';
import { useWeekTrayOpen } from '../useWeekTray';
import { useToday } from '../useToday';
import DeleteCategoryDialog from './DeleteCategoryDialog';
import styles from './TopBar.module.css';

/** Opens and closes the week view's "Por planificar" side panel, with how many tasks are waiting there. */
function TrayToggle() {
    const { data: categories = [] } = useCategories();
    const { data: tasks = [] } = useTasks();
    const [open, setOpen] = useWeekTrayOpen();
    const pending = backlogTasks(tasks, categories).filter((t) => !t.done).length;
    return (
        <button
            type="button"
            className={cx(styles.trayToggle, open && styles.trayToggleOn)}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
        >
            Por planificar
            <span className={styles.trayToggleCount}>{pending}</span>
        </button>
    );
}

/** Prev / next / today, followed by the range they move through. Shared by the calendar and planning views. */
function RangeNav({ label, unit }: { label: string; unit: 'month' | 'week' }) {
    const goPrev = usePlannerStore((s) => s.goPrev);
    const goNext = usePlannerStore((s) => s.goNext);
    const goToday = usePlannerStore((s) => s.goToday);
    const prevLabel = unit === 'month' ? 'Mes anterior' : 'Semana anterior';
    const nextLabel = unit === 'month' ? 'Mes siguiente' : 'Semana siguiente';
    return (
        <>
            <div className={styles.nav}>
                <div className={styles.arrows}>
                    <IconButton aria-label={prevLabel} title={`${prevLabel} (←)`} onClick={goPrev}>
                        <span className={styles.arrow}>‹</span>
                    </IconButton>
                    <IconButton aria-label={nextLabel} title={`${nextLabel} (→)`} onClick={goNext}>
                        <span className={styles.arrow}>›</span>
                    </IconButton>
                </div>
                <Button variant="secondary" size="sm" title="Ir a hoy (h)" onClick={goToday}>
                    Hoy
                </Button>
            </div>
            <h1 className={`${styles.title} ${styles.sentence}`} aria-live="polite">
                {label}
            </h1>
        </>
    );
}

function Plus() {
    return (
        <span className={styles.plus} aria-hidden="true">
            +
        </span>
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
    const [confirmingDelete, setConfirmingDelete] = useState(false);
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
        <header className={styles.bar}>
            <div className={styles.lead}>
                {isCategoryView && selectedCategory && (
                    <div className={styles.crumbs}>
                        <button type="button" className={styles.crumbLink} onClick={goToCategoriesList}>
                            Categorías
                        </button>
                        <span className={styles.crumbSlash} aria-hidden="true">
                            /
                        </span>
                        <Swatch hue={selectedCategory.hue} />
                        <h1 className={styles.title}>{selectedCategory.name}</h1>
                    </div>
                )}
                {isCategoriesListView && <h1 className={styles.title}>Categorías</h1>}
                {isSettingsView && <h1 className={styles.title}>Configuración</h1>}
                {(isCalendarView || isPlanningView) && <RangeNav label={rangeLabel} unit={isMonthView ? 'month' : 'week'} />}
            </div>

            <div className={styles.actions}>
                {/* Week-only controls go first, so Mes / Semana sits in the same spot in both calendar views. */}
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
                {isWeekView && <TrayToggle />}
                {isCalendarView && (
                    <SegmentedControl
                        ariaLabel="Vista"
                        value={isMonthView ? 'month' : 'week'}
                        onChange={(v) => (v === 'month' ? goToMonth() : goToWeek())}
                        options={[
                            { value: 'month', label: 'Mes' },
                            { value: 'week', label: 'Semana' },
                        ]}
                    />
                )}
                {isCalendarView && (
                    <>
                        <span className={styles.divider} aria-hidden="true" />
                        <Button onClick={() => openEventModalNew()}>
                            <Plus />
                            Agregar evento
                        </Button>
                    </>
                )}
                {isCategoriesListView && (
                    <Button onClick={openCategoryModalNew}>
                        <Plus />
                        Nueva categoría
                    </Button>
                )}
                {isCategoryView && selectedCategoryId && (
                    <>
                        <Button variant="secondary" size="sm" onClick={() => openCategoryModalEdit(selectedCategoryId)}>
                            Editar categoría
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
                            Eliminar
                        </Button>
                    </>
                )}
            </div>
            {confirmingDelete && selectedCategory && (
                <DeleteCategoryDialog
                    category={selectedCategory}
                    onCancel={() => setConfirmingDelete(false)}
                    onDeleted={() => {
                        setConfirmingDelete(false);
                        goToCategoriesList();
                    }}
                />
            )}
        </header>
    );
}
