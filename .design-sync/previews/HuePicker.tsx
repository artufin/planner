import { useState } from 'react';
import { HuePicker } from '@planner/ui';

export function Basic() {
    const [hue, setHue] = useState(255);
    return (
        <div style={{ width: 300 }}>
            <div className="pl-field__label">Color</div>
            <HuePicker value={hue} onChange={setHue} />
        </div>
    );
}

export function OtherSelection() {
    const [hue, setHue] = useState(20);
    return (
        <div style={{ width: 300 }}>
            <div className="pl-field__label">Color</div>
            <HuePicker value={hue} onChange={setHue} />
        </div>
    );
}

export function CustomSize() {
    const [hue, setHue] = useState(120);
    return (
        <div style={{ width: 300 }}>
            <div className="pl-field__label">Color</div>
            <HuePicker value={hue} onChange={setHue} size={20} />
        </div>
    );
}
