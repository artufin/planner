'use client';

import { cx } from '@planner/ui';
import { useToastStore } from './toast';
import s from './Toaster.module.css';

/** Renders the toast stack. Mount once, at the app root. */
export default function Toaster() {
    const toasts = useToastStore((st) => st.toasts);
    const dismiss = useToastStore((st) => st.dismiss);

    return (
        <div className={s.region} role="region" aria-label="Avisos">
            <ol className={s.stack}>
                {toasts.map((t) => (
                    <li
                        key={t.id}
                        className={cx(s.toast, t.tone === 'error' && s.error)}
                        role={t.tone === 'error' ? 'alert' : 'status'}
                    >
                        <span className={s.message}>{t.message}</span>
                        {t.action && (
                            <button
                                type="button"
                                className={s.action}
                                onClick={() => {
                                    t.action!.onAction();
                                    dismiss(t.id);
                                }}
                            >
                                {t.action.label}
                            </button>
                        )}
                        <button type="button" className={s.close} onClick={() => dismiss(t.id)} aria-label="Cerrar aviso">
                            <svg viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M4 4l8 8M12 4l-8 8" />
                            </svg>
                        </button>
                    </li>
                ))}
            </ol>
        </div>
    );
}
