import { create } from 'zustand';
import type { SettingsSubview, ViewName } from './types';

interface ModalState {
    open: boolean;
    editingId: string | null;
    presetCategoryId: string | null;
    /** Schedule modal only: when set, editingId is treated as a single occurrence's date rather than the whole series. */
    occurrenceDate?: string | null;
    /** Task and event modals: prefills the date field for a new entry (e.g. the planning board's per-day "+", or a double-click on a calendar day). */
    presetDate?: string | null;
}

const CLOSED_MODAL: ModalState = { open: false, editingId: null, presetCategoryId: null, occurrenceDate: null };

const SIDEBAR_KEY = 'planner:sidebar-collapsed';

/** Where the user is: the slice of state that the URL mirrors (see useUrlState). */
export interface NavState {
    view: ViewName;
    selectedCategoryId: string | null;
    monthOffset: number;
    weekOffset: number;
    settingsSubview: SettingsSubview;
}

/** Views that page through time — the only ones prev/next/today mean anything in. */
export function isDatedView(view: ViewName): boolean {
    return view === 'month' || view === 'week' || view === 'planning';
}

/** Read once after mount (see Sidebar), so the first render never depends on the browser. */
export function readStoredSidebarCollapsed(): boolean {
    try {
        return window.localStorage.getItem(SIDEBAR_KEY) === '1';
    } catch {
        return false;
    }
}

function storeSidebarCollapsed(collapsed: boolean) {
    try {
        window.localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
    } catch {
        // Private mode or blocked storage: the choice just won't survive a reload.
    }
}

interface PlannerState {
    // ---- navigation / UI ----
    view: ViewName;
    selectedCategoryId: string | null;
    monthOffset: number;
    weekOffset: number;
    weekZoom: number;
    settingsSubview: SettingsSubview;
    sidebarCollapsed: boolean;
    shortcutsOpen: boolean;

    eventModal: ModalState;
    taskModal: ModalState;
    scheduleModal: ModalState;
    categoryModal: ModalState;

    // ---- navigation actions ----
    goToMonth: () => void;
    goToWeek: () => void;
    goToCategoriesList: () => void;
    goToPlanning: () => void;
    goToSettings: () => void;
    setSettingsSubview: (v: SettingsSubview) => void;
    selectCategory: (id: string) => void;
    goPrev: () => void;
    goNext: () => void;
    goToday: () => void;
    /** Today in a dated view; from anywhere else, today in the month calendar. */
    jumpToToday: () => void;
    /** Replaces the navigation slice wholesale — used to restore it from the URL. */
    applyNav: (nav: Partial<NavState>) => void;
    zoomIn: () => void;
    zoomOut: () => void;

    // ---- chrome ----
    toggleSidebar: () => void;
    /** Hydration only: sets the state without writing it back to storage. */
    setSidebarCollapsed: (collapsed: boolean) => void;
    openShortcuts: () => void;
    closeShortcuts: () => void;

    // ---- modals ----
    openCategoryModalNew: () => void;
    openCategoryModalEdit: (id: string) => void;
    closeCategoryModal: () => void;

    openScheduleModalNew: (presetCategoryId?: string | null) => void;
    openScheduleModalEdit: (id: string) => void;
    openScheduleModalOccurrence: (scheduleId: string, date: string) => void;
    closeScheduleModal: () => void;

    openEventModalNew: (presetCategoryId?: string | null, presetDate?: string | null) => void;
    openEventModalEdit: (id: string) => void;
    closeEventModal: () => void;

    openTaskModalNew: (presetCategoryId?: string | null, presetDate?: string | null) => void;
    openTaskModalEdit: (id: string) => void;
    closeTaskModal: () => void;
}

export const usePlannerStore = create<PlannerState>()((set) => ({
    view: 'month',
    selectedCategoryId: null,
    monthOffset: 0,
    weekOffset: 0,
    weekZoom: 56,
    settingsSubview: 'groups',
    sidebarCollapsed: false,
    shortcutsOpen: false,

    eventModal: CLOSED_MODAL,
    taskModal: CLOSED_MODAL,
    scheduleModal: CLOSED_MODAL,
    categoryModal: CLOSED_MODAL,

    goToMonth: () => set({ view: 'month' }),
    goToWeek: () => set({ view: 'week' }),
    goToCategoriesList: () => set({ view: 'categoriesList' }),
    goToPlanning: () => set({ view: 'planning' }),
    goToSettings: () => set({ view: 'settings' }),
    setSettingsSubview: (v) => set({ settingsSubview: v }),
    selectCategory: (id) => set({ view: 'category', selectedCategoryId: id }),
    goPrev: () =>
        set((s) =>
            s.view === 'week' || s.view === 'planning'
                ? { weekOffset: s.weekOffset - 1 }
                : { monthOffset: s.monthOffset - 1 },
        ),
    goNext: () =>
        set((s) =>
            s.view === 'week' || s.view === 'planning'
                ? { weekOffset: s.weekOffset + 1 }
                : { monthOffset: s.monthOffset + 1 },
        ),
    goToday: () => set({ monthOffset: 0, weekOffset: 0 }),
    jumpToToday: () =>
        set((s) => (isDatedView(s.view) ? { monthOffset: 0, weekOffset: 0 } : { view: 'month', monthOffset: 0, weekOffset: 0 })),
    applyNav: (nav) => set(nav),
    zoomIn: () => set((s) => ({ weekZoom: Math.min(120, s.weekZoom + 16) })),
    zoomOut: () => set((s) => ({ weekZoom: Math.max(24, s.weekZoom - 16) })),

    toggleSidebar: () =>
        set((s) => {
            storeSidebarCollapsed(!s.sidebarCollapsed);
            return { sidebarCollapsed: !s.sidebarCollapsed };
        }),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    openShortcuts: () => set({ shortcutsOpen: true }),
    closeShortcuts: () => set({ shortcutsOpen: false }),

    openCategoryModalNew: () => set({ categoryModal: { open: true, editingId: null, presetCategoryId: null } }),
    openCategoryModalEdit: (id) => set({ categoryModal: { open: true, editingId: id, presetCategoryId: null } }),
    closeCategoryModal: () => set({ categoryModal: CLOSED_MODAL }),

    openScheduleModalNew: (presetCategoryId = null) =>
        set({ scheduleModal: { open: true, editingId: null, presetCategoryId, occurrenceDate: null } }),
    openScheduleModalEdit: (id) => set({ scheduleModal: { open: true, editingId: id, presetCategoryId: null, occurrenceDate: null } }),
    openScheduleModalOccurrence: (scheduleId, date) =>
        set({ scheduleModal: { open: true, editingId: scheduleId, presetCategoryId: null, occurrenceDate: date } }),
    closeScheduleModal: () => set({ scheduleModal: CLOSED_MODAL }),

    openEventModalNew: (presetCategoryId = null, presetDate = null) =>
        set({ eventModal: { open: true, editingId: null, presetCategoryId, presetDate } }),
    openEventModalEdit: (id) => set({ eventModal: { open: true, editingId: id, presetCategoryId: null } }),
    closeEventModal: () => set({ eventModal: CLOSED_MODAL }),

    openTaskModalNew: (presetCategoryId = null, presetDate = null) =>
        set({ taskModal: { open: true, editingId: null, presetCategoryId, presetDate } }),
    openTaskModalEdit: (id) => set({ taskModal: { open: true, editingId: id, presetCategoryId: null } }),
    closeTaskModal: () => set({ taskModal: CLOSED_MODAL }),
}));
