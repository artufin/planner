import { useLayoutEffect } from 'react';
import { usePlannerStore, type NavState } from './store';
import type { SettingsSubview, ViewName } from './types';

/*
 * Mirrors where the user is into the query string, in Spanish:
 *
 *   (none)                         month, current
 *   ?vista=mes&mes=-2              month, two back
 *   ?vista=semana&semana=1         week, next
 *   ?vista=planificacion&semana=0  planning board
 *   ?vista=materias                categories list
 *   ?vista=materia&id=<id>         one category
 *   ?vista=ajustes&seccion=grupos  settings
 *
 * Changing view pushes a history entry, so the back button returns to the
 * previous view; paging through months/weeks only replaces the current one.
 */

const VIEW_PARAM: Record<ViewName, string> = {
    month: 'mes',
    week: 'semana',
    planning: 'planificacion',
    categoriesList: 'materias',
    category: 'materia',
    settings: 'ajustes',
};

const SECTION_PARAM: Record<SettingsSubview, string> = {
    groups: 'grupos',
    categories: 'materias',
    schedule: 'horario',
};

function invert<K extends string>(map: Record<K, string>): Map<string, K> {
    return new Map(Object.entries(map).map(([k, v]) => [v as string, k as K]));
}

const VIEW_BY_PARAM = invert(VIEW_PARAM);
const SECTION_BY_PARAM = invert(SECTION_PARAM);

const MAX_OFFSET = 600;

/** A whole number within reach, or 0 for anything else. */
function parseOffset(raw: string | null): number {
    const n = raw === null ? NaN : Number.parseInt(raw, 10);
    return Number.isFinite(n) ? Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, n)) : 0;
}

export function navToSearch(nav: NavState): string {
    const p = new URLSearchParams();
    switch (nav.view) {
        case 'month':
            if (nav.monthOffset !== 0) {
                p.set('vista', VIEW_PARAM.month);
                p.set('mes', String(nav.monthOffset));
            }
            break;
        case 'week':
        case 'planning':
            p.set('vista', VIEW_PARAM[nav.view]);
            if (nav.weekOffset !== 0) p.set('semana', String(nav.weekOffset));
            break;
        case 'category':
            p.set('vista', VIEW_PARAM.category);
            if (nav.selectedCategoryId) p.set('id', nav.selectedCategoryId);
            break;
        case 'settings':
            p.set('vista', VIEW_PARAM.settings);
            p.set('seccion', SECTION_PARAM[nav.settingsSubview]);
            break;
        case 'categoriesList':
            p.set('vista', VIEW_PARAM.categoriesList);
            break;
    }
    const search = p.toString();
    return search ? `?${search}` : '';
}

/** Only the fields the URL speaks for; offsets of views not shown are left alone. */
export function searchToNav(search: string): Partial<NavState> {
    const p = new URLSearchParams(search);
    const view = VIEW_BY_PARAM.get(p.get('vista') ?? '') ?? 'month';
    switch (view) {
        case 'month':
            return { view, monthOffset: parseOffset(p.get('mes')) };
        case 'week':
        case 'planning':
            return { view, weekOffset: parseOffset(p.get('semana')) };
        case 'category': {
            const id = p.get('id');
            return id ? { view, selectedCategoryId: id } : { view: 'categoriesList' };
        }
        case 'settings':
            return { view, settingsSubview: SECTION_BY_PARAM.get(p.get('seccion') ?? '') ?? 'groups' };
        case 'categoriesList':
            return { view };
    }
}

/** Two states are the same "page" when only the offset differs. */
function pageKey(nav: NavState): string {
    if (nav.view === 'category') return `category:${nav.selectedCategoryId}`;
    if (nav.view === 'settings') return `settings:${nav.settingsSubview}`;
    return nav.view;
}

function urlFor(search: string): string {
    return `${window.location.pathname}${search}${window.location.hash}`;
}

/**
 * Keeps the store's navigation and the address bar in step. Mount once, high
 * in the tree. Runs as a layout effect so a reload lands on the right view
 * before the first paint, without the server render ever depending on it.
 */
export function useUrlState() {
    useLayoutEffect(() => {
        const store = usePlannerStore;
        const fromUrl = () => store.getState().applyNav(searchToNav(window.location.search));

        fromUrl();
        // Tidy a hand-typed or outdated URL into its canonical form.
        const canonical = navToSearch(store.getState());
        if (canonical !== window.location.search) window.history.replaceState(window.history.state, '', urlFor(canonical));

        window.addEventListener('popstate', fromUrl);
        const unsubscribe = store.subscribe((state, prev) => {
            const search = navToSearch(state);
            if (search === window.location.search) return;
            if (pageKey(state) !== pageKey(prev)) window.history.pushState(null, '', urlFor(search));
            else window.history.replaceState(window.history.state, '', urlFor(search));
        });

        return () => {
            window.removeEventListener('popstate', fromUrl);
            unsubscribe();
        };
    }, []);
}
