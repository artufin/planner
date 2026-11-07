'use client';

import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { Button, TextField } from '@/components/ui';
import styles from './login.module.css';

/** Only same-origin paths, so a crafted `?next=` can't bounce the user off-site after login. */
function safeNext(): string {
    if (typeof window === 'undefined') return '/';
    const next = new URLSearchParams(window.location.search).get('next');
    if (!next || !next.startsWith('/') || next.startsWith('//')) return '/';
    return next;
}

const dateFormatter = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
const noopSubscribe = () => () => {};
const todayLabel = () => dateFormatter.format(new Date());

/** Today's date, written at the top of the page like in a notebook. Client-only, so server markup never disagrees with the user's clock. */
function useTodayLabel(): string {
    return useSyncExternalStore(noopSubscribe, todayLabel, () => '');
}

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const date = useTodayLabel();

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
        <main className={styles.page}>
            <div className={styles.stack}>
                <div className={styles.sheet}>
                    <div className={styles.head}>
                        <p className={styles.date}>{date}</p>
                        <h1 className={styles.wordmark}>Planner</h1>
                        <p className={styles.greeting}>Hola de nuevo :)</p>
                    </div>
                    <form onSubmit={onSubmit} className={styles.form}>
                        <TextField
                            label="Contraseña"
                            type="password"
                            autoFocus
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={error ?? undefined}
                        />
                        <Button type="submit" className={styles.submit} disabled={pending || !password}>
                            {pending ? 'Entrando…' : 'Entrar'}
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}
