import { Button, Checkbox, HuePicker, Modal, SelectField, TextField, TimeInput } from '@planner/ui';

const categories = [
    { value: 'alg', label: 'Álgebra Lineal' },
    { value: 'fis', label: 'Física' },
    { value: 'his', label: 'Historia' },
];

/**
 * Modal's backdrop is `position: fixed`, which would anchor to the viewport and
 * escape the preview card. A `transform` on this wrapper makes it the
 * containing block for fixed descendants, so the modal renders exactly as
 * authored — just contained. Nothing about the component is changed.
 */
function Stage({ children, height = 560 }: { children: React.ReactNode; height?: number }) {
    return (
        <div
            style={{
                position: 'relative',
                transform: 'translateZ(0)',
                overflow: 'hidden',
                width: '100%',
                maxWidth: 460,
                height,
                borderRadius: 'var(--pl-radius-xl)',
                background: 'var(--pl-color-page-bg)',
            }}
        >
            {children}
        </div>
    );
}

export function TaskForm() {
    return (
        <Stage>
            <Modal
                asForm
                title="Nueva tarea"
                onClose={() => {}}
                footer={
                    <>
                        <span />
                        <Button type="submit">Guardar</Button>
                    </>
                }
            >
                <TextField label="Título" placeholder="ej. Repasar materia" defaultValue="" />
                <SelectField label="Categoría" options={categories} defaultValue="alg" />
                <TextField label="Fecha (opcional)" type="date" defaultValue="2026-03-12" />
                <Checkbox label="Incluir horario" defaultChecked />
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                        <TimeInput label="Hora inicio" value="09:00" onChange={() => {}} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <TimeInput label="Hora término" value="10:30" onChange={() => {}} />
                    </div>
                </div>
            </Modal>
        </Stage>
    );
}

export function EditingWithDelete() {
    return (
        <Stage height={420}>
            <Modal
                asForm
                title="Editar categoría"
                width={340}
                onClose={() => {}}
                footer={
                    <>
                        <Button variant="danger">Eliminar</Button>
                        <Button type="submit">Guardar</Button>
                    </>
                }
            >
                <TextField label="Nombre" defaultValue="Álgebra Lineal" />
                <SelectField label="Grupo" options={[{ value: 'u', label: 'Universidad' }]} defaultValue="u" />
                <div>
                    <div className="pl-field__label">Color</div>
                    <HuePicker value={255} onChange={() => {}} />
                </div>
            </Modal>
        </Stage>
    );
}
