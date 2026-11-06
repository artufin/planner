'use client';

import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { cx } from '@planner/ui';
import { readStoredSidebarCollapsed, usePlannerStore } from '../store';
import { MONTH_NAMES, WEEKDAY_OPTIONS } from '../constants';
import { useToday } from '../useToday';
import styles from './Sidebar.module.css';

/** Below this width the sidebar is always the narrow rail — there's no room for the full one. */
const NARROW_QUERY = '(max-width: 760px)';

function subscribeNarrow(onChange: () => void): () => void {
    const mq = window.matchMedia(NARROW_QUERY);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
}

function useIsNarrow(): boolean {
    return useSyncExternalStore(
        subscribeNarrow,
        () => window.matchMedia(NARROW_QUERY).matches,
        () => false,
    );
}

function NavIcon({ children }: { children: ReactNode }) {
    return (
        <svg className={styles.navIcon} viewBox="0 0 24 24" aria-hidden="true">
            {children}
        </svg>
    );
}

const ICONS = {
    calendar: (
        <NavIcon>
            <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
            <path d="M3.5 10h17M8 3v4M16 3v4" />
        </NavIcon>
    ),
    planning: (
        <NavIcon>
            <path d="M3.5 6.5l1.8 1.8L8.5 5M3.5 13.5l1.8 1.8 3.2-3.3M12 7h8.5M12 14h8.5M4 20h16.5" />
        </NavIcon>
    ),
    categories: (
        <NavIcon>
            <path d="M3.5 7.5a2 2 0 0 1 2-2h3.8l2 2.5h7.2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
        </NavIcon>
    ),
    settings: (
        <NavIcon>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </NavIcon>
    ),
    keyboard: (
        <NavIcon>
            <rect x="2.5" y="6" width="19" height="12.5" rx="2" />
            <path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7.5 14.5h9" />
        </NavIcon>
    ),
    collapse: (
        <NavIcon>
            <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
            <path d="M9.5 4.5v15M16 9.5L13.5 12l2.5 2.5" />
        </NavIcon>
    ),
    expand: (
        <NavIcon>
            <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
            <path d="M9.5 4.5v15M13.5 9.5L16 12l-2.5 2.5" />
        </NavIcon>
    ),
};

/** The rail's stand-in for the hidden label. Visual only — the button carries an aria-label. */
function Tip({ children }: { children: ReactNode }) {
    return (
        <span className={styles.tip} aria-hidden="true">
            {children}
        </span>
    );
}

function NavButton({
    active,
    icon,
    label,
    shortcut,
    collapsed,
    subtle = false,
    onClick,
}: {
    active: boolean;
    icon: ReactNode;
    label: string;
    shortcut?: string;
    collapsed: boolean;
    subtle?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className={cx(styles.navItem, subtle && styles.navItemSubtle)}
            aria-current={active ? 'page' : undefined}
            aria-label={collapsed ? label : undefined}
            onClick={onClick}
        >
            {icon}
            <span className={styles.navLabel}>{label}</span>
            {collapsed && (
                <Tip>
                    {label}
                    {shortcut && <kbd className={styles.tipKey}>{shortcut}</kbd>}
                </Tip>
            )}
        </button>
    );
}

export default function Sidebar() {
    const view = usePlannerStore((s) => s.view);
    const goToMonth = usePlannerStore((s) => s.goToMonth);
    const goToPlanning = usePlannerStore((s) => s.goToPlanning);
    const goToCategoriesList = usePlannerStore((s) => s.goToCategoriesList);
    const goToSettings = usePlannerStore((s) => s.goToSettings);
    const jumpToToday = usePlannerStore((s) => s.jumpToToday);
    const sidebarCollapsed = usePlannerStore((s) => s.sidebarCollapsed);
    const toggleSidebar = usePlannerStore((s) => s.toggleSidebar);
    const setSidebarCollapsed = usePlannerStore((s) => s.setSidebarCollapsed);
    const openShortcuts = usePlannerStore((s) => s.openShortcuts);
    const narrow = useIsNarrow();
    const today = useToday();

    /** Width changes animate only once the stored preference is in, so a reload doesn't play the collapse. */
    const [animated, setAnimated] = useState(false);

    useLayoutEffect(() => {
        setSidebarCollapsed(readStoredSidebarCollapsed());
    }, [setSidebarCollapsed]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setAnimated(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const collapsed = sidebarCollapsed || narrow;

    const isCalendarView = view === 'month' || view === 'week';
    const isCategoriesModuleView = view === 'categoriesList' || view === 'category';
    const isPlanningView = view === 'planning';
    const isSettingsView = view === 'settings';

    const weekday = WEEKDAY_OPTIONS.find((w) => w.value === today.getDay())?.label.toLowerCase() ?? '';
    const month = MONTH_NAMES[today.getMonth()];
    const toggleLabel = collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral';

    return (
        <aside
            id="planner-sidebar"
            className={cx(styles.sidebar, collapsed && styles.collapsed, animated && styles.animated)}
        >
            <div className={styles.head}>
                <p className={styles.wordmark}>Planner</p>
                {!narrow && (
                    <button
                        type="button"
                        className={styles.toggle}
                        aria-expanded={!collapsed}
                        aria-controls="planner-sidebar"
                        aria-label={toggleLabel}
                        title={collapsed ? undefined : `${toggleLabel} ([)`}
                        onClick={toggleSidebar}
                    >
                        {collapsed ? ICONS.expand : ICONS.collapse}
                        {collapsed && (
                            <Tip>
                                {toggleLabel}
                                <kbd className={styles.tipKey}>[</kbd>
                            </Tip>
                        )}
                    </button>
                )}
            </div>

            {/* The date stamp jumps back to the current week/month; outside a dated view it opens the calendar first. */}
            <button
                type="button"
                className={styles.today}
                onClick={jumpToToday}
                aria-label={`Ir a hoy, ${weekday} ${today.getDate()} de ${month}`}
                title={collapsed ? undefined : 'Ir a hoy (h)'}
            >
                <span className={`${styles.todayNumber} pl-marker`}>{today.getDate()}</span>
                <span className={styles.todayText}>
                    <span className={styles.todayWeekday}>{weekday}</span>
                    <span className={styles.todayMonth}>
                        {month} {today.getFullYear()}
                    </span>
                </span>
                {collapsed && (
                    <Tip>
                        Ir a hoy<kbd className={styles.tipKey}>h</kbd>
                    </Tip>
                )}
            </button>

            <nav className={styles.nav} aria-label="Secciones">
                <ul className={styles.navList}>
                    <li>
                        <NavButton
                            active={isCalendarView}
                            icon={ICONS.calendar}
                            label="Calendario"
                            shortcut="m"
                            collapsed={collapsed}
                            onClick={goToMonth}
                        />
                    </li>
                    <li>
                        <NavButton
                            active={isPlanningView}
                            icon={ICONS.planning}
                            label="Planificación"
                            shortcut="p"
                            collapsed={collapsed}
                            onClick={goToPlanning}
                        />
                    </li>
                    <li>
                        <NavButton
                            active={isCategoriesModuleView}
                            icon={ICONS.categories}
                            label="Categorías"
                            collapsed={collapsed}
                            onClick={goToCategoriesList}
                        />
                    </li>
                </ul>
            </nav>

            <div className={styles.footer}>
                <NavButton
                    active={isSettingsView}
                    icon={ICONS.settings}
                    label="Configuración"
                    collapsed={collapsed}
                    onClick={goToSettings}
                />
                <NavButton
                    active={false}
                    subtle
                    icon={ICONS.keyboard}
                    label="Atajos de teclado"
                    shortcut="?"
                    collapsed={collapsed}
                    onClick={openShortcuts}
                />
            </div>
        </aside>
    );
}
