'use client';

import { useMemo } from 'react';
import { usePlannerStore } from '../../store';
import { useGroups } from '@/lib/api/groups';
import { useCategories } from '@/lib/api/categories';
import { useTasks } from '@/lib/api/tasks';
import { colors } from '../../styles';
import { solidColor, softTextColor } from '../../utils';

export default function CategoriesListView() {
    const { data: groups = [] } = useGroups();
    const { data: categories = [] } = useCategories();
    const { data: tasks = [] } = useTasks();
    const selectCategory = usePlannerStore((s) => s.selectCategory);

    const categoryGroups = useMemo(() => {
        const cards = categories.map((c) => {
            const pending = tasks.filter((t) => t.categoryId === c.id && !t.done).length;
            return {
                id: c.id,
                groupId: c.groupId,
                hue: c.hue,
                name: c.name,
                pendingLabel: pending === 0 ? 'Sin pendientes' : `${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}`,
            };
        });
        return groups
            .map((g) => ({ name: g.name, cards: cards.filter((c) => c.groupId === g.id) }))
            .filter((g) => g.cards.length > 0);
    }, [groups, categories, tasks]);

    return (
        <div style={{ padding: '28px 32px', maxWidth: 940 }}>
            {categoryGroups.map((grp, gi) => (
                <div key={grp.name + gi}>
                    <div style={{ position: 'relative', margin: gi ? '28px 0 14px' : '0 0 14px' }}>
                        <div style={{ borderTop: '1px solid oklch(85% 0.005 95)' }} />
                        <div
                            style={{
                                position: 'absolute',
                                top: -8,
                                left: 8,
                                background: colors.pageBg,
                                padding: '0 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                color: colors.muted,
                            }}
                        >
                            {grp.name}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
                        {grp.cards.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => selectCategory(c.id)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 3,
                                    padding: 14,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: 10,
                                    background: '#fff',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ width: '100%', height: 4, borderRadius: 3, background: solidColor(c.hue), marginBottom: 6 }} />
                                <div style={{ fontSize: 14.5, fontWeight: 700 }}>{c.name}</div>
                                <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 6, color: softTextColor(c.hue) }}>{c.pendingLabel}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
