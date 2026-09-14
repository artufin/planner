'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePlannerStore } from '../../store';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/lib/api/categories';
import { useGroups } from '@/lib/api/groups';
import { apiErrorMessage } from '@/lib/api/http';
import { categoryFormSchema, type CategoryFormValues } from '../../schemas';
import { HUE_SWATCHES } from '../../constants';
import { closeButtonStyle, dangerButtonStyle, inputStyle, labelStyle, modalCardStyle, modalHeaderStyle, modalOverlayStyle, modalTitleStyle, primaryButtonStyle } from '../../styles';
import { solidColor } from '../../utils';

export default function CategoryModal() {
    const { data: categories = [] } = useCategories();
    const { data: groups = [] } = useGroups();
    const categoryModal = usePlannerStore((s) => s.categoryModal);
    const closeCategoryModal = usePlannerStore((s) => s.closeCategoryModal);
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();

    const editingCategory = categoryModal.editingId ? categories.find((c) => c.id === categoryModal.editingId) : undefined;

    const defaultValues = useMemo<CategoryFormValues>(() => {
        if (editingCategory) return { name: editingCategory.name, hue: editingCategory.hue };
        return { name: '', hue: 255 };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { register, handleSubmit, watch, setValue } = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues,
    });

    const hue = watch('hue');
    const [groupId, setGroupId] = useState(editingCategory?.groupId ?? groups[0]?.id ?? '');

    const onSubmit = (values: CategoryFormValues) => {
        const onError = (e: unknown) => window.alert(apiErrorMessage(e));
        if (editingCategory) {
            updateCategory.mutate(
                { id: editingCategory.id, name: values.name.trim(), hue: values.hue, groupId: groupId || null },
                { onSuccess: closeCategoryModal, onError },
            );
        } else {
            createCategory.mutate(
                { name: values.name.trim(), hue: values.hue, groupId: groupId || null },
                { onSuccess: closeCategoryModal, onError },
            );
        }
    };

    return (
        <div style={modalOverlayStyle}>
            <form onSubmit={handleSubmit(onSubmit)} style={{ ...modalCardStyle, width: 340 }}>
                <div style={modalHeaderStyle}>
                    <div style={modalTitleStyle}>{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</div>
                    <button type="button" onClick={closeCategoryModal} style={closeButtonStyle} aria-label="Cerrar">×</button>
                </div>
                <div>
                    <div style={labelStyle}>Nombre</div>
                    <input {...register('name')} placeholder="ej. Álgebra Lineal" style={inputStyle} />
                </div>
                <div>
                    <div style={labelStyle}>Grupo</div>
                    <select value={groupId} onChange={(e) => setGroupId(e.target.value)} style={inputStyle}>
                        {groups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <div style={{ ...labelStyle, marginBottom: 6 }}>Color</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {HUE_SWATCHES.map((h) => (
                            <div
                                key={h}
                                onClick={() => setValue('hue', h)}
                                style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 7,
                                    cursor: 'pointer',
                                    background: solidColor(h),
                                    boxShadow: hue === h ? `0 0 0 2px #fff, 0 0 0 4px ${solidColor(h)}` : 'none',
                                }}
                            />
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                    {editingCategory ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm('¿Eliminar esta categoría y todos sus horarios/eventos/tareas?')) {
                                    deleteCategory.mutate(editingCategory.id, {
                                        onSuccess: closeCategoryModal,
                                        onError: (e) => window.alert(apiErrorMessage(e)),
                                    });
                                }
                            }}
                            style={dangerButtonStyle}
                        >
                            Eliminar
                        </button>
                    ) : (
                        <div />
                    )}
                    <button type="submit" style={primaryButtonStyle}>Guardar</button>
                </div>
            </form>
        </div>
    );
}
