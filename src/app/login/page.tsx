'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { Button, Card, TextField, colors } from '@planner/ui';

/** Only same-origin paths, so a crafted `?next=` can't bounce the user off-site after login. */
function safeNext(): string {
    if (typeof window === 'undefined') return '/';
    const next = new URLSearchParams(window.location.search).get('next');
    if (!next || !next.startsWith('/') || next.startsWith('//')) return '/';
    return next;
}

const pageStyle: CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.pageBg,
    color: colors.text,
    padding: 20,
};

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function onSubmit(event: FormEvent) {
        event.preventDefault();
        setPending(true);
        setError(null);
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                setError(body?.error ?? 'No se pudo iniciar sesión');
                setPending(false);
                return;
            }
            // Full navigation so the middleware re-runs with the fresh cookie.
            window.location.assign(safeNext());
        } catch {
            setError('No se pudo conectar con el servidor');
            setPending(false);
        }
    }

    return (
        <main style={pageStyle}>
            <Card style={{ width: 320, padding: 24, boxShadow: '0 12px 32px oklch(0% 0 0 / 0.08)' }}>
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Planner :)</div>
                    <TextField
                        label="Contraseña"
                        type="password"
                        autoFocus
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={error ?? undefined}
                    />
                    <Button type="submit" disabled={pending || !password}>
                        {pending ? 'Entrando…' : 'Entrar'}
                    </Button>
                </form>
            </Card>
        </main>
    );
}
