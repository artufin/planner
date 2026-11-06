'use client';

import { Modal } from '@planner/ui';
import { usePlannerStore } from '../store';
import { SHORTCUTS } from '../useShortcuts';
import s from './ShortcutsDialog.module.css';

/** The list behind "Atajos de teclado" in the sidebar, and the "?" key. */
export default function ShortcutsDialog() {
    const closeShortcuts = usePlannerStore((st) => st.closeShortcuts);

    return (
        <Modal width={360} title="Atajos de teclado" onClose={closeShortcuts}>
            <dl className={s.list}>
                {SHORTCUTS.map((sc) => (
                    <div key={sc.label} className={s.row}>
                        <dt className={s.keys}>
                            {sc.keys.map((k) => (
                                <kbd key={k} className={s.key}>
                                    {k}
                                </kbd>
                            ))}
                        </dt>
                        <dd className={s.label}>{sc.label}</dd>
                    </div>
                ))}
            </dl>
            <p className={s.note}>No se activan mientras escribes en un campo o hay una ventana abierta.</p>
        </Modal>
    );
}
