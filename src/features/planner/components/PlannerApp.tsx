'use client';

import { usePlannerStore } from '../store';
import { colors } from '../styles';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import PlanningView from './views/PlanningView';
import CategoriesListView from './views/CategoriesListView';
import CategoryView from './views/CategoryView';
import SettingsView from './views/SettingsView';
import EventModal from './modals/EventModal';
import TaskModal from './modals/TaskModal';
import ScheduleModal from './modals/ScheduleModal';
import CategoryModal from './modals/CategoryModal';

export default function PlannerApp() {
    const view = usePlannerStore((s) => s.view);
    const eventModalOpen = usePlannerStore((s) => s.eventModal.open);
    const taskModalOpen = usePlannerStore((s) => s.taskModal.open);
    const scheduleModalOpen = usePlannerStore((s) => s.scheduleModal.open);
    const categoryModalOpen = usePlannerStore((s) => s.categoryModal.open);

    const contentAreaStyle =
        view === 'month' || view === 'settings'
            ? { flex: 1, overflow: 'hidden' as const, minWidth: 0 }
            : { flex: 1, overflow: 'auto' as const, minWidth: 0 };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', background: colors.pageBg, color: colors.text, overflow: 'hidden' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <TopBar />
                <div style={contentAreaStyle}>
                    {view === 'month' && <MonthView />}
                    {view === 'week' && <WeekView />}
                    {view === 'planning' && <PlanningView />}
                    {view === 'categoriesList' && <CategoriesListView />}
                    {view === 'category' && <CategoryView />}
                    {view === 'settings' && <SettingsView />}
                </div>
            </div>

            {eventModalOpen && <EventModal />}
            {taskModalOpen && <TaskModal />}
            {scheduleModalOpen && <ScheduleModal />}
            {categoryModalOpen && <CategoryModal />}
        </div>
    );
}
