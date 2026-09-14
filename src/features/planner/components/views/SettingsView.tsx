'use client';

import { useState } from 'react';
import { Button, IconButton, Swatch, TimeInput, colors } from '@planner/ui';
import { usePlannerStore } from '../../store';
import { useGroups, useRenameGroup, useCreateGroup, useDeleteGroup } from '@/lib/api/groups';
import { useCategories, useUpdateCategory } from '@/lib/api/categories';
import { useTimeDivisions, useAddTimeDivision, useDeleteTimeDivision } from '@/lib/api/timeDivisions';
import { apiErrorMessage } from '@/lib/api/http';
import type { SettingsSubview } from '../../types';
import { timeToMinutes } from '../../utils';

const TABS: { id: SettingsSubview; label: string }[] = [
    { id: 'groups', label: 'Grupos' },
    { id: 'categories', label: 'Categorías' },
    { id: 'schedule', label: 'Horario' },
];

function tabStyle(active: boolean) {
    return {
        padding: '9px 10px',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        background: active ? colors.accentSoftBg : undefined,
        color: active ? colors.accentText : colors.textNav,
    } as const;
}

const listRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    background: colors.surface,
} as const;

const sectionTitleStyle = { fontSize: 15, fontWeight: 700 } as const;

export default function SettingsView() {
    const settingsSubview = usePlannerStore((s) => s.settingsSubview);
    const setSettingsSubview = usePlannerStore((s) => s.setSettingsSubview);
    const { data: groups = [] } = useGroups();
    const { data: categories = [] } = useCategories();
    const { data: timeDivisions = [] } = useTimeDivisions();
    const createGroup = useCreateGroup();
    const renameGroup = useRenameGroup();
    const deleteGroup = useDeleteGroup();
    const updateCategory = useUpdateCategory();
    const addTimeDivision = useAddTimeDivision();
    const deleteTimeDivision = useDeleteTimeDivision();

    const [newDivisionTime, setNewDivisionTime] = useState('12:00');

    const sortedDivisions = [...timeDivisions].sort((a, b) => timeToMinutes(a.value) - timeToMinutes(b.value));

    return (
        <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ width: 190, flex: 'none', borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {TABS.map((tab) => (
                    <div key={tab.id} onClick={() => setSettingsSubview(tab.id)} style={tabStyle(settingsSubview === tab.id)}>
                        {tab.label}
                    </div>
                ))}
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px', maxWidth: 700 }}>
                {settingsSubview === 'groups' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={sectionTitleStyle}>Grupos de categorías</div>
                            <Button variant="secondary" size="sm" onClick={() => createGroup.mutate('Nuevo grupo')}>
                                + Agregar grupo
                            </Button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {groups.map((g) => {
                                const count = categories.filter((c) => c.groupId === g.id).length;
                                return (
                                    <div key={g.id} style={listRowStyle}>
                                        <input
                                            defaultValue={g.name}
                                            onBlur={(e) => {
                                                if (e.target.value !== g.name) renameGroup.mutate({ id: g.id, name: e.target.value });
                                            }}
                                            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', color: colors.fieldText, background: 'transparent' }}
                                        />
                                        <div style={{ fontSize: 11, color: colors.mutedLight }}>
                                            {count} {count === 1 ? 'categoría' : 'categorías'}
                                        </div>
                                        <IconButton
                                            size="sm"
                                            aria-label={`Eliminar ${g.name}`}
                                            onClick={() => deleteGroup.mutate(g.id, { onError: (e) => window.alert(apiErrorMessage(e)) })}
                                            style={{ borderColor: colors.dangerBorder, color: colors.dangerText }}
                                        >
                                            ×
                                        </IconButton>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {settingsSubview === 'categories' && (
                    <>
                        <div style={{ ...sectionTitleStyle, marginBottom: 14 }}>Categorías por grupo</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {categories.map((c) => (
                                <div key={c.id} style={{ ...listRowStyle, gap: 10 }}>
                                    <Swatch hue={c.hue} size={12} />
                                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                                    <select
                                        value={c.groupId ?? ''}
                                        onChange={(e) => updateCategory.mutate({ id: c.id, groupId: e.target.value })}
                                        className="pl-input"
                                        style={{ width: 'auto', height: 30, padding: '0 8px', borderRadius: 7, fontSize: 12 }}
                                    >
                                        {groups.map((g) => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {settingsSubview === 'schedule' && (
                    <>
                        <div style={{ ...sectionTitleStyle, marginBottom: 6 }}>Divisiones horarias (vista Semana)</div>
                        <div style={{ fontSize: 12, color: colors.muted, marginBottom: 14 }}>
                            Las divisiones se ubican en su posición real dentro del día, manteniendo la proporción de tiempo entre ellas.
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <TimeInput value={newDivisionTime} onChange={setNewDivisionTime} />
                            <Button size="sm" onClick={() => addTimeDivision.mutate(newDivisionTime)}>
                                + Agregar división
                            </Button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {sortedDivisions.map((d) => (
                                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 5px 5px 12px', borderRadius: 7, background: colors.chipBg, fontSize: 12.5, fontWeight: 600, color: colors.textStrong }}>
                                    {d.value}
                                    <IconButton
                                        size="xs"
                                        variant="plain"
                                        tone="muted"
                                        aria-label={`Eliminar división ${d.value}`}
                                        onClick={() => deleteTimeDivision.mutate(d.value, { onError: (e) => window.alert(apiErrorMessage(e)) })}
                                    >
                                        ×
                                    </IconButton>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
