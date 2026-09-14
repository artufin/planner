import { useState } from 'react';
import { TextField } from '@planner/ui';

const box: React.CSSProperties = { width: 320 };

export function Basic() {
    const [v, setV] = useState('Repasar Álgebra Lineal');
    return (
        <div style={box}>
            <TextField label="Título" value={v} onChange={(e) => setV(e.target.value)} />
        </div>
    );
}

export function Placeholder() {
    return (
        <div style={box}>
            <TextField label="Título" placeholder="ej. Repasar materia" defaultValue="" />
        </div>
    );
}

export function WithHint() {
    return (
        <div style={box}>
            <TextField
                label="Fecha (opcional)"
                type="date"
                defaultValue=""
                hint="Sin fecha, la tarea queda en el backlog hasta que le asignes un día."
            />
        </div>
    );
}

export function WithError() {
    return (
        <div style={box}>
            <TextField label="Nombre" defaultValue="" error="El nombre es obligatorio" />
        </div>
    );
}

export function Disabled() {
    return (
        <div style={box}>
            <TextField label="Categoría" defaultValue="Álgebra Lineal" disabled />
        </div>
    );
}
