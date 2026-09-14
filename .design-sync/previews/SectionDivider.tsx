import { CategoryCard, SectionDivider } from '@planner/ui';

export function Basic() {
    return (
        <div style={{ width: 360, background: 'var(--pl-color-page-bg)', padding: 16 }}>
            <SectionDivider label="Universidad" />
        </div>
    );
}

export function GroupingCards() {
    return (
        <div style={{ width: 420, background: 'var(--pl-color-page-bg)', padding: 16 }}>
            <SectionDivider label="Universidad" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, margin: '14px 0 0' }}>
                <CategoryCard name="Álgebra Lineal" hue={255} meta="3 pendientes" />
                <CategoryCard name="Física" hue={20} meta="Sin pendientes" />
            </div>
            <div style={{ margin: '28px 0 14px' }}>
                <SectionDivider label="Personal" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                <CategoryCard name="Gimnasio" hue={120} meta="1 pendiente" />
                <CategoryCard name="Lectura" hue={300} meta="2 pendientes" />
            </div>
        </div>
    );
}
