import { useState } from 'react';
import { SegmentedControl } from '@planner/ui';

export function ViewSwitcher() {
    const [view, setView] = useState('month');
    return (
        <SegmentedControl
            ariaLabel="Vista"
            value={view}
            onChange={setView}
            options={[
                { value: 'month', label: 'Calendario' },
                { value: 'week', label: 'Semana' },
            ]}
        />
    );
}

export function Small() {
    const [view, setView] = useState('week');
    return (
        <SegmentedControl
            ariaLabel="Vista"
            size="sm"
            value={view}
            onChange={setView}
            options={[
                { value: 'month', label: 'Calendario' },
                { value: 'week', label: 'Semana' },
                { value: 'planning', label: 'Planificación' },
            ]}
        />
    );
}

export function ButtonGroup() {
    return (
        <SegmentedControl
            ariaLabel="Zoom"
            size="sm"
            value={null}
            options={[
                { value: 'out', label: '−', ariaLabel: 'Alejar' },
                { value: 'in', label: '+', ariaLabel: 'Acercar' },
            ]}
        />
    );
}
