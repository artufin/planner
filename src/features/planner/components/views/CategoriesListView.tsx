'use client';

import { useMemo } from 'react';
import { CategoryCard, SectionDivider } from '@planner/ui';
import { usePlannerStore } from '../../store';
import { useGroups } from '@/lib/api/groups';
import { useCategories } from '@/lib/api/categories';
import { useTasks } from '@/lib/api/tasks';

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
                    <div style={{ margin: gi ? '28px 0 14px' : '0 0 14px' }}>
                        <SectionDivider label={grp.name} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
                        {grp.cards.map((c) => (
                            <CategoryCard
                                key={c.id}
                                name={c.name}
                                hue={c.hue}
                                meta={c.pendingLabel}
                                onClick={() => selectCategory(c.id)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
