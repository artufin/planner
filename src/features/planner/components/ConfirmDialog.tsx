'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Button, Modal } from '@/components/ui';
import s from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
    title: string;
    /** What will happen, concretely — counts, names, whether it can be undone. */
    children: ReactNode;
    /** Names the action ("Eliminar categoría"), never "Aceptar". */
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    /** Disables the confirm button while the request is in flight. */
    pending?: boolean;
}

/**
 * A short "are you sure" sheet for destructive actions that can't be undone.
 * Cancel holds the focus when it opens, so a stray Enter backs out.
 */
export default function ConfirmDialog({ title, children, confirmLabel, onConfirm, onCancel, pending = false }: ConfirmDialogProps) {
    const bodyRef = useRef<HTMLDivElement>(null);

    // Runs after Modal's own focus effect (children's effects run first), so it
    // wins over the sheet's default focus while Modal still remembers the trigger.
    useEffect(() => {
        const card = bodyRef.current?.closest('.pl-modal__card');
        card?.querySelector<HTMLButtonElement>('[data-confirm-cancel]')?.focus({ preventScroll: true });
    }, []);

    return (
        <Modal
            width={360}
            title={title}
            onClose={onCancel}
            footer={
                <div className={s.actions}>
                    <Button variant="secondary" data-confirm-cancel="" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={onConfirm} disabled={pending}>
                        {confirmLabel}
                    </Button>
                </div>
            }
        >
            <div ref={bodyRef} className={s.body}>
                {children}
            </div>
        </Modal>
    );
}
