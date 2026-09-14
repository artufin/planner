import { TaskCard } from '@planner/ui';

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, width: 240 };

export function Basic() {
    return (
        <div style={col}>
            <TaskCard title="Repasar Álgebra Lineal" hue={255} onToggle={() => {}} onOpen={() => {}} />
        </div>
    );
}

export function WithDeadlines() {
    return (
        <div style={col}>
            <TaskCard title="Entregar informe" hue={20} deadlineLabel="9 mar" deadlineTone="overdue" onToggle={() => {}} />
            <TaskCard title="Preparar certamen" hue={70} deadlineLabel="15 mar" deadlineTone="soon" onToggle={() => {}} />
            <TaskCard title="Leer capítulo 4" hue={120} deadlineLabel="28 mar" onToggle={() => {}} />
        </div>
    );
}

export function Done() {
    return (
        <div style={col}>
            <TaskCard title="Subir tarea al aula virtual" hue={190} done onToggle={() => {}} />
            <TaskCard title="Repasar Álgebra Lineal" hue={190} onToggle={() => {}} />
        </div>
    );
}

export function Categories() {
    return (
        <div style={col}>
            <TaskCard title="Sin categoría" hue={null} onToggle={() => {}} />
            <TaskCard title="Álgebra Lineal" hue={255} onToggle={() => {}} />
            <TaskCard title="Historia" hue={340} onToggle={() => {}} />
        </div>
    );
}

export function LongTitle() {
    return (
        <div style={col}>
            <TaskCard
                title="Terminar el informe de laboratorio de física experimental"
                hue={300}
                deadlineLabel="12 mar"
                onToggle={() => {}}
            />
        </div>
    );
}
