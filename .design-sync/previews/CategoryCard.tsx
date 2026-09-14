import { CategoryCard } from '@planner/ui';

export function Basic() {
    return (
        <div style={{ width: 220 }}>
            <CategoryCard name="Álgebra Lineal" hue={255} meta="3 pendientes" onClick={() => {}} />
        </div>
    );
}

export function Grid() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(160px, 1fr))', gap: 14, width: 360 }}>
            <CategoryCard name="Álgebra Lineal" hue={255} meta="3 pendientes" onClick={() => {}} />
            <CategoryCard name="Física" hue={20} meta="Sin pendientes" onClick={() => {}} />
            <CategoryCard name="Historia" hue={340} meta="1 pendiente" onClick={() => {}} />
            <CategoryCard name="Gimnasio" hue={120} meta="2 pendientes" onClick={() => {}} />
        </div>
    );
}

export function Uncategorized() {
    return (
        <div style={{ width: 220 }}>
            <CategoryCard name="Sin categoría" hue={null} meta="4 pendientes" onClick={() => {}} />
        </div>
    );
}
