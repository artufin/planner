import { ColumnHeader, TaskCard } from '@planner/ui';

export function Backlog() {
    return (
        <div style={{ width: 220 }}>
            <ColumnHeader label="BACKLOG" onAdd={() => {}} />
        </div>
    );
}

export function Weekdays() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 220 }}>
            <ColumnHeader label="LUN" value={14} onAdd={() => {}} />
            <ColumnHeader label="MAR" value={15} onAdd={() => {}} />
            <ColumnHeader label="MIÉ" value={16} active onAdd={() => {}} />
        </div>
    );
}

export function WithColumn() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 220 }}>
            <ColumnHeader label="MIÉ" value={16} active onAdd={() => {}} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <TaskCard title="Repasar Álgebra" hue={255} onToggle={() => {}} />
                <TaskCard title="Entregar informe" hue={20} deadlineLabel="16 mar" deadlineTone="soon" onToggle={() => {}} />
                <TaskCard title="Leer capítulo 4" hue={120} done onToggle={() => {}} />
            </div>
        </div>
    );
}
