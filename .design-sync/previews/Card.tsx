import { Card } from '@planner/ui';

export function Basic() {
    return (
        <div style={{ width: 240 }}>
            <Card>
                <div style={{ fontSize: 'var(--pl-text-lg)', fontWeight: 700 }}>Resumen de la semana</div>
                <div style={{ fontSize: 'var(--pl-text-sm)', color: 'var(--pl-color-muted)', marginTop: 6 }}>
                    4 eventos · 7 tareas pendientes
                </div>
            </Card>
        </div>
    );
}

export function Padding() {
    return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 180 }}>
                <Card padding="md">
                    <div style={{ fontSize: 'var(--pl-text-md)', fontWeight: 700 }}>md</div>
                    <div style={{ fontSize: 'var(--pl-text-xs)', color: 'var(--pl-color-muted)' }}>14px de padding</div>
                </Card>
            </div>
            <div style={{ width: 180 }}>
                <Card padding="sm">
                    <div style={{ fontSize: 'var(--pl-text-md)', fontWeight: 700 }}>sm</div>
                    <div style={{ fontSize: 'var(--pl-text-xs)', color: 'var(--pl-color-muted)' }}>10px de padding</div>
                </Card>
            </div>
        </div>
    );
}

export function Grid() {
    const items = ['Álgebra Lineal', 'Física', 'Historia', 'Cálculo II'];
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))', gap: 12, width: 320 }}>
            {items.map((name) => (
                <Card key={name} interactive>
                    <div style={{ fontSize: 'var(--pl-text-md)', fontWeight: 700 }}>{name}</div>
                    <div style={{ fontSize: 'var(--pl-text-xs)', color: 'var(--pl-color-muted)', marginTop: 4 }}>
                        Sin pendientes
                    </div>
                </Card>
            ))}
        </div>
    );
}
