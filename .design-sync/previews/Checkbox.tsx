import { useState } from 'react';
import { Checkbox, TimeInput } from '@planner/ui';

export function States() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Checkbox label="Incluir horario" defaultChecked={false} />
            <Checkbox label="Incluir fecha límite (deadline)" defaultChecked />
            <Checkbox label="Repetir cada dos semanas" disabled />
        </div>
    );
}

export function GatingASection() {
    const [hasTime, setHasTime] = useState(true);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
            <Checkbox label="Incluir horario" checked={hasTime} onChange={(e) => setHasTime(e.target.checked)} />
            {hasTime && (
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                        <TimeInput label="Hora inicio" value="09:00" onChange={() => {}} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <TimeInput label="Hora término" value="10:30" onChange={() => {}} />
                    </div>
                </div>
            )}
        </div>
    );
}
