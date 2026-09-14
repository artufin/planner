import { Button } from '@planner/ui';

const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' };

export function Variants() {
    return (
        <div style={row}>
            <Button>Guardar</Button>
            <Button variant="secondary">Editar categoría</Button>
            <Button variant="danger">Eliminar</Button>
            <Button variant="ghost">Cancelar</Button>
        </div>
    );
}

export function Sizes() {
    return (
        <div style={row}>
            <Button size="md">+ Agregar evento</Button>
            <Button size="sm">+ Agregar evento</Button>
            <Button variant="secondary" size="md">Editar</Button>
            <Button variant="secondary" size="sm">Editar</Button>
        </div>
    );
}

export function Disabled() {
    return (
        <div style={row}>
            <Button disabled>Guardar</Button>
            <Button variant="secondary" disabled>Editar</Button>
            <Button variant="danger" disabled>Eliminar</Button>
        </div>
    );
}

export function ModalFooter() {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                width: 340,
                padding: 14,
                border: '1px solid var(--pl-color-border)',
                borderRadius: 'var(--pl-radius-xl)',
                background: 'var(--pl-color-surface)',
            }}
        >
            <Button variant="danger">Eliminar</Button>
            <Button type="submit">Guardar</Button>
        </div>
    );
}
