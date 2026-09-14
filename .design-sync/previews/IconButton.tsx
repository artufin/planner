import { IconButton } from '@planner/ui';

const label: React.CSSProperties = {
    width: 64,
    flex: 'none',
    fontSize: 'var(--pl-text-xs)',
    fontWeight: 600,
    color: 'var(--pl-color-muted)',
};

const labelledRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 };

export function Toolbar() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconButton aria-label="Semana anterior">‹</IconButton>
            <IconButton aria-label="Semana siguiente">›</IconButton>
        </div>
    );
}

export function Sizes() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={labelledRow}>
                <span style={label}>md · 28px</span>
                <IconButton size="md" aria-label="Anterior">‹</IconButton>
            </div>
            <div style={labelledRow}>
                <span style={label}>sm · 26px</span>
                <IconButton size="sm" aria-label="Siguiente">›</IconButton>
            </div>
            <div style={labelledRow}>
                <span style={label}>xs · 20px</span>
                <IconButton size="xs" aria-label="Nueva tarea">+</IconButton>
            </div>
        </div>
    );
}

export function Variants() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={labelledRow}>
                <span style={label}>outline</span>
                <IconButton variant="outline" aria-label="Anterior">‹</IconButton>
            </div>
            <div style={labelledRow}>
                <span style={label}>solid</span>
                <div
                    style={{
                        display: 'inline-flex',
                        background: 'var(--pl-color-control-bg)',
                        borderRadius: 9,
                        padding: 3,
                    }}
                >
                    <IconButton variant="solid" size="sm" aria-label="Acercar">+</IconButton>
                </div>
            </div>
            <div style={labelledRow}>
                <span style={label}>plain</span>
                <IconButton variant="plain" tone="muted" close aria-label="Cerrar">×</IconButton>
            </div>
        </div>
    );
}

export function Tones() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={labelledRow}>
                <span style={label}>default</span>
                <IconButton variant="outline" tone="default" aria-label="Anterior">‹</IconButton>
            </div>
            <div style={labelledRow}>
                <span style={label}>muted</span>
                <IconButton variant="outline" tone="muted" aria-label="Anterior">‹</IconButton>
            </div>
            <div style={labelledRow}>
                <span style={label}>accent</span>
                <IconButton variant="outline" tone="accent" aria-label="Anterior">‹</IconButton>
            </div>
        </div>
    );
}

export function InTintedTrack() {
    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--pl-color-control-bg)',
                borderRadius: 9,
                padding: 3,
            }}
        >
            <IconButton size="sm" variant="solid" aria-label="Alejar">−</IconButton>
            <IconButton size="sm" variant="solid" aria-label="Acercar">+</IconButton>
        </div>
    );
}
