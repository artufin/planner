import { useState } from 'react';
import { TimeInput } from '@planner/ui';

export function Standalone() {
    const [v, setV] = useState('09:00');
    return <TimeInput value={v} onChange={setV} />;
}

export function LabelledPair() {
    const [start, setStart] = useState('09:00');
    const [end, setEnd] = useState('10:30');
    return (
        <div style={{ display: 'flex', gap: 10, width: 320 }}>
            <div style={{ flex: 1 }}>
                <TimeInput label="Hora inicio" value={start} onChange={setStart} />
            </div>
            <div style={{ flex: 1 }}>
                <TimeInput label="Hora término" value={end} onChange={setEnd} />
            </div>
        </div>
    );
}

export function Disabled() {
    return (
        <div style={{ width: 320 }}>
            <TimeInput label="Hora inicio" value="08:15" onChange={() => {}} disabled />
        </div>
    );
}
