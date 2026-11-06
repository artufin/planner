'use client';

import { useState, type ReactNode } from 'react';
import { Button, IconButton, SectionDivider, Swatch, TimeInput, cx } from '@planner/ui';
import { usePlannerStore } from '../../store';
import { useGroups, useRenameGroup, useCreateGroup, useDeleteGroup } from '@/lib/api/groups';
import { useCategories, useUpdateCategory } from '@/lib/api/categories';
import { useTimeDivisions, useAddTimeDivision, useDeleteTimeDivision } from '@/lib/api/timeDivisions';
import { toast } from '../../toast/toast';
import type { Category, Group } from '@/lib/api/types';
import type { SettingsSubview } from '../../types';
import { timeToMinutes } from '../../utils';
import { plural } from './subjectInsights';
import s from './SettingsView.module.css';

const TABS: { id: SettingsSubview; label: string; hint: string }[] = [
    { id: 'groups', label: 'Grupos', hint: 'Cómo se ordenan tus categorías' },
    { id: 'categories', label: 'Categorías', hint: 'A qué grupo va cada una' },
    { id: 'schedule', label: 'Horario', hint: 'Cortes del día en la vista Semana' },
];

export default function SettingsView() {
    const settingsSubview = usePlannerStore((st) => st.settingsSubview);
    const setSettingsSubview = usePlannerStore((st) => st.setSettingsSubview);

    return (
        <div className={s.root}>
            <nav className={s.nav} aria-label="Secciones de configuración">
                {TABS.map((tab) => {
                    const active = settingsSubview === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            aria-current={active ? 'page' : undefined}
                            className={cx(s.navItem, active && s.navItemActive)}
                            onClick={() => setSettingsSubview(tab.id)}
                        >
                            <span className={s.navLabel}>
                                <span className={cx(active && 'pl-marker')}>{tab.label}</span>
                            </span>
                            <span className={s.navHint}>{tab.hint}</span>
                        </button>
                    );
                })}
            </nav>
            <div className={s.content}>
                <div className={s.inner}>
                    {settingsSubview === 'groups' && <GroupsPanel />}
                    {settingsSubview === 'categories' && <CategoriesPanel />}
                    {settingsSubview === 'schedule' && <DivisionsPanel />}
                </div>
            </div>
        </div>
    );
}

function PanelHead({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
    return (
        <header className={s.head}>
            <div>
                <h2 className={cx('pl-display', s.title)}>{title}</h2>
                <p className={s.lede}>{children}</p>
            </div>
            {action}
        </header>
    );
}

/* ---- groups ----------------------------------------------------------------- */

function GroupsPanel() {
    const { data: groups = [] } = useGroups();
    const { data: categories = [] } = useCategories();
    const createGroup = useCreateGroup();
    const addGroup = () => createGroup.mutate('Nuevo grupo');

    return (
        <>
            <PanelHead
                title="Grupos"
                action={
                    groups.length > 0 && (
                        <Button variant="secondary" size="sm" onClick={addGroup}>
                            Agregar grupo
                        </Button>
                    )
                }
            >
                Los grupos ordenan tus categorías en la lista, por ejemplo por semestre o separando lo personal de la universidad.
                Haz clic en un nombre para cambiarlo.
            </PanelHead>
            {groups.length === 0 ? (
                <div className={s.empty}>
                    <p>Aún no tienes grupos. Crea uno, como «Primer semestre» o «Personal», y luego asígnale categorías.</p>
                    <Button size="sm" onClick={addGroup}>
                        Crear un grupo
                    </Button>
                </div>
            ) : (
                <ul className={s.sheet}>
                    {groups.map((g) => (
                        <GroupRow key={g.id} group={g} categories={categories.filter((c) => c.groupId === g.id)} />
                    ))}
                </ul>
            )}
        </>
    );
}

function GroupRow({ group, categories }: { group: Group; categories: Category[] }) {
    const renameGroup = useRenameGroup();
    const deleteGroup = useDeleteGroup();

    return (
        <li className={s.row}>
            <input
                className={s.nameInput}
                defaultValue={group.name}
                aria-label="Nombre del grupo"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                    if (e.key === 'Escape') {
                        e.currentTarget.value = group.name;
                        e.currentTarget.blur();
                    }
                }}
                onBlur={(e) => {
                    const name = e.target.value.trim();
                    if (!name) e.target.value = group.name;
                    else if (name !== group.name) renameGroup.mutate({ id: group.id, name }, { onError: toast.error });
                }}
            />
            {categories.length > 0 && (
                <span className={s.swatches} aria-hidden="true">
                    {categories.slice(0, 8).map((c) => (
                        <Swatch key={c.id} hue={c.hue} size={10} />
                    ))}
                </span>
            )}
            <span className={s.rowMeta}>{categories.length === 0 ? 'Vacío' : plural(categories.length, 'categoría', 'categorías')}</span>
            <IconButton
                size="sm"
                variant="plain"
                tone="muted"
                className={s.deleteBtn}
                aria-label={`Eliminar el grupo ${group.name}`}
                onClick={() => deleteGroup.mutate(group.id, { onError: toast.error })}
            >
                ×
            </IconButton>
        </li>
    );
}

/* ---- categories ------------------------------------------------------------- */

function CategoriesPanel() {
    const { data: groups = [] } = useGroups();
    const { data: categories = [] } = useCategories();
    const openCategoryModalNew = usePlannerStore((st) => st.openCategoryModalNew);

    const known = new Set(groups.map((g) => g.id));
    const sections = groups.map((g) => ({ id: g.id, name: g.name, items: categories.filter((c) => c.groupId === g.id) }));
    const loose = categories.filter((c) => c.groupId === null || !known.has(c.groupId));
    if (loose.length > 0) sections.push({ id: '__none', name: 'Sin grupo', items: loose });

    return (
        <>
            <PanelHead
                title="Categorías"
                action={
                    <Button variant="secondary" size="sm" onClick={openCategoryModalNew}>
                        Nueva categoría
                    </Button>
                }
            >
                Mueve cada categoría al grupo que le corresponde. Para cambiar su nombre o color, haz clic en ella.
            </PanelHead>
            {categories.length === 0 ? (
                <div className={s.empty}>
                    <p>Todavía no hay categorías. Crea una por cada materia o área de tu vida que quieras organizar.</p>
                </div>
            ) : (
                sections.map((sec) => (
                    <section key={sec.id} className={s.block} aria-label={sec.name}>
                        <SectionDivider level={3} label={sec.name} aside={plural(sec.items.length, 'categoría', 'categorías')} />
                        {sec.items.length === 0 ? (
                            <p className={s.blockEmpty}>Ninguna categoría en este grupo.</p>
                        ) : (
                            <ul className={s.sheet}>
                                {sec.items.map((c) => (
                                    <CategoryRow key={c.id} category={c} groups={groups} />
                                ))}
                            </ul>
                        )}
                    </section>
                ))
            )}
        </>
    );
}

function CategoryRow({ category, groups }: { category: Category; groups: Group[] }) {
    const updateCategory = useUpdateCategory();
    const openCategoryModalEdit = usePlannerStore((st) => st.openCategoryModalEdit);
    const hasGroup = groups.some((g) => g.id === category.groupId);

    return (
        <li className={s.row}>
            <button type="button" className={s.catName} onClick={() => openCategoryModalEdit(category.id)}>
                <Swatch hue={category.hue} size={12} />
                <span>{category.name}</span>
            </button>
            <select
                value={hasGroup ? (category.groupId ?? '') : ''}
                onChange={(e) => updateCategory.mutate({ id: category.id, groupId: e.target.value || null }, { onError: toast.error })}
                className={cx('pl-input', s.select)}
                aria-label={`Grupo de ${category.name}`}
            >
                <option value="">Sin grupo</option>
                {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                        {g.name}
                    </option>
                ))}
            </select>
        </li>
    );
}

/* ---- time divisions --------------------------------------------------------- */

function DivisionsPanel() {
    const { data: timeDivisions = [] } = useTimeDivisions();
    const addTimeDivision = useAddTimeDivision();
    const deleteTimeDivision = useDeleteTimeDivision();
    const [newTime, setNewTime] = useState('12:00');

    const sorted = [...timeDivisions].sort((a, b) => timeToMinutes(a.value) - timeToMinutes(b.value));
    const valid = /^\d{2}:\d{2}$/.test(newTime);
    const exists = sorted.some((d) => d.value === newTime);
    const pct = (t: string) => (timeToMinutes(t) / (24 * 60)) * 100;

    return (
        <>
            <PanelHead title="Divisiones horarias">
                Son las líneas que cortan el día en la vista Semana, como los bloques de un horario escolar. Cada una se dibuja a
                su hora real, así que la distancia entre ellas muestra cuánto dura cada bloque.
            </PanelHead>

            <div className={s.ruler} role="img" aria-label={sorted.length ? `Divisiones a las ${sorted.map((d) => d.value).join(', ')}` : 'Sin divisiones'}>
                <div className={s.rulerTrack}>
                    {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
                        <span key={h} className={s.rulerTick} style={{ left: `${(h / 24) * 100}%` }}>
                            <span className={s.rulerTickLabel}>{h}h</span>
                        </span>
                    ))}
                    {sorted.map((d, i) => (
                        <span key={d.id} className={cx(s.rulerPin, i % 2 === 1 && s.rulerPinRaised)} style={{ left: `${pct(d.value)}%` }}>
                            <span className={s.rulerPinLabel}>{d.value}</span>
                        </span>
                    ))}
                </div>
            </div>

            <form
                className={s.addRow}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (valid && !exists) addTimeDivision.mutate(newTime, { onError: toast.error });
                }}
            >
                <TimeInput value={newTime} onChange={setNewTime} aria-label="Hora de la nueva división" />
                <Button type="submit" size="sm" disabled={!valid || exists}>
                    Agregar división
                </Button>
                {exists && <span className={s.addHint}>Ya hay una división a las {newTime}.</span>}
            </form>

            {sorted.length === 0 ? (
                <div className={s.empty}>
                    <p>No hay divisiones todavía. Agrega la hora en que empieza cada bloque de clases, por ejemplo 08:00, 10:00 y 12:00.</p>
                </div>
            ) : (
                <ul className={s.chips}>
                    {sorted.map((d) => (
                        <li key={d.id} className={s.chip}>
                            <span className={s.chipTime}>{d.value}</span>
                            <IconButton
                                size="xs"
                                variant="plain"
                                tone="muted"
                                className={s.deleteBtn}
                                aria-label={`Eliminar la división de las ${d.value}`}
                                onClick={() => deleteTimeDivision.mutate(d.value, { onError: toast.error })}
                            >
                                ×
                            </IconButton>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
