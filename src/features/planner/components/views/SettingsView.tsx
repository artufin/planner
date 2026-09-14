'use client';

import { useState } from 'react';
import { usePlannerStore } from '../../store';
import { useGroups, useRenameGroup, useCreateGroup, useDeleteGroup } from '@/lib/api/groups';
import { useCategories, useUpdateCategory } from '@/lib/api/categories';
import { useTimeDivisions, useAddTimeDivision, useDeleteTimeDivision } from '@/lib/api/timeDivisions';
import { apiErrorMessage } from '@/lib/api/http';
import { colors, smallSecondaryButtonStyle } from '../../styles';
import type { SettingsSubview } from '../../types';
import { solidColor, timeToMinutes } from '../../utils';
import { TimeInput } from '../TimeInput';

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
        color: active ? colors.accentText : 'oklch(35% 0.01 95)',
    } as const;
}

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
                            <div style={{ fontSize: 15, fontWeight: 700 }}>Grupos de categorías</div>
                            <button onClick={() => createGroup.mutate('Nuevo grupo')} style={smallSecondaryButtonStyle}>+ Agregar grupo</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {groups.map((g) => {
                                const count = categories.filter((c) => c.groupId === g.id).length;
                                return (
                                    <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid oklch(90% 0.004 95)', borderRadius: 10, background: '#fff' }}>
                                        <input
                                            defaultValue={g.name}
                                            onBlur={(e) => {
                                                if (e.target.value !== g.name) renameGroup.mutate({ id: g.id, name: e.target.value });
                                            }}
                                            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', color: 'oklch(25% 0.01 95)', background: 'transparent' }}
                                        />
                                        <div style={{ fontSize: 11, color: 'oklch(60% 0.01 95)' }}>{count} {count === 1 ? 'categoría' : 'categorías'}</div>
                                        <button
                                            onClick={() => deleteGroup.mutate(g.id, { onError: (e) => window.alert(apiErrorMessage(e)) })}
                                            style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${colors.dangerBorder}`, background: '#fff', cursor: 'pointer', color: colors.dangerText, fontSize: 13 }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {settingsSubview === 'categories' && (
                    <>
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Categorías por grupo</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {categories.map((c) => (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid oklch(90% 0.004 95)', borderRadius: 10, background: '#fff' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 4, background: solidColor(c.hue), flex: 'none' }} />
                                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                                    <select
                                        value={c.groupId ?? ''}
                                        onChange={(e) => updateCategory.mutate({ id: c.id, groupId: e.target.value })}
                                        style={{ height: 30, padding: '0 8px', border: '1px solid oklch(87% 0.004 95)', borderRadius: 7, fontSize: 12, fontFamily: 'inherit' }}
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
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Divisiones horarias (vista Semana)</div>
                        <div style={{ fontSize: 12, color: colors.muted, marginBottom: 14 }}>
                            Las divisiones se ubican en su posición real dentro del día, manteniendo la proporción de tiempo entre ellas.
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                            <TimeInput
                                value={newDivisionTime}
                                onChange={setNewDivisionTime}
                                style={{ height: 32, padding: '0 10px', border: '1px solid oklch(87% 0.004 95)', borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }}
                            />
                            <button
                                onClick={() => addTimeDivision.mutate(newDivisionTime)}
                                style={{ height: 32, padding: '0 14px', borderRadius: 7, border: 'none', background: colors.accent, color: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}
                            >
                                + Agregar división
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {sortedDivisions.map((d) => (
                                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 5px 5px 12px', borderRadius: 7, background: colors.chipBg, fontSize: 12.5, fontWeight: 600, color: 'oklch(30% 0.01 95)' }}>
                                    {d.value}
                                    <button
                                        onClick={() => deleteTimeDivision.mutate(d.value, { onError: (e) => window.alert(apiErrorMessage(e)) })}
                                        style={{ width: 20, height: 20, borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer', color: colors.muted, fontSize: 13 }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
