import { SelectField } from '@planner/ui';

const box: React.CSSProperties = { width: 320 };

const categories = [
    { value: 'alg', label: 'Álgebra Lineal' },
    { value: 'fis', label: 'Física' },
    { value: 'his', label: 'Historia' },
];

export function Basic() {
    return (
        <div style={box}>
            <SelectField label="Categoría" options={categories} defaultValue="alg" />
        </div>
    );
}

export function WithPlaceholder() {
    return (
        <div style={box}>
            <SelectField
                label="Asociar a evento (opcional)"
                placeholder="Ninguno"
                options={[
                    { value: 'e1', label: 'Certamen 1' },
                    { value: 'e2', label: 'Entrega informe' },
                ]}
                defaultValue=""
            />
        </div>
    );
}

export function WithError() {
    return (
        <div style={box}>
            <SelectField label="Grupo" options={categories} defaultValue="" placeholder="Selecciona un grupo" error="Elige un grupo" />
        </div>
    );
}
