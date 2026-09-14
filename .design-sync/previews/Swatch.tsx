import { HUE_SWATCHES, Swatch } from '@planner/ui';

const shapeLabel: React.CSSProperties = {
    width: 44,
    flex: 'none',
    fontSize: 'var(--pl-text-xs)',
    fontWeight: 600,
    color: 'var(--pl-color-muted)',
};

export function Shapes() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={shapeLabel}>dot</span>
                <Swatch hue={255} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={shapeLabel}>tile</span>
                <Swatch hue={255} shape="tile" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={shapeLabel}>bar</span>
                <div style={{ flex: 1 }}>
                    <Swatch hue={255} shape="bar" />
                </div>
            </div>
        </div>
    );
}

export function Palette() {
    return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: 260 }}>
            {HUE_SWATCHES.map((h) => (
                <Swatch key={h} hue={h} shape="tile" />
            ))}
        </div>
    );
}

export function Selected() {
    return (
        <div style={{ display: 'flex', gap: 12, padding: 4 }}>
            <Swatch hue={255} shape="tile" selected onClick={() => {}} ariaLabel="Azul" />
            <Swatch hue={20} shape="tile" onClick={() => {}} ariaLabel="Rojo" />
            <Swatch hue={120} shape="tile" onClick={() => {}} ariaLabel="Verde" />
        </div>
    );
}

export function BesideATitle() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Swatch hue={165} />
            <div style={{ fontSize: 'var(--pl-text-xl)', fontWeight: 700 }}>Álgebra Lineal</div>
        </div>
    );
}

export function Uncategorized() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Swatch hue={null} />
            <div style={{ fontSize: 'var(--pl-text-xl)', fontWeight: 700 }}>Sin categoría</div>
        </div>
    );
}
