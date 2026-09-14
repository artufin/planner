'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, HuePicker, Modal, SelectField, TextField } from '@planner/ui';
import { usePlannerStore } from '../../store';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/lib/api/categories';
import { useGroups } from '@/lib/api/groups';
import { apiErrorMessage } from '@/lib/api/http';
import { categoryFormSchema, type CategoryFormValues } from '../../schemas';

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
        <Modal
            asForm
            width={340}
            title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
            onClose={closeCategoryModal}
            onSubmit={handleSubmit(onSubmit)}
            footer={
                <>
                    {editingCategory ? (
                        <Button
                            variant="danger"
                            onClick={() => {
                                if (window.confirm('¿Eliminar esta categoría y todos sus horarios/eventos/tareas?')) {
                                    deleteCategory.mutate(editingCategory.id, {
                                        onSuccess: closeCategoryModal,
                                        onError: (e) => window.alert(apiErrorMessage(e)),
                                    });
                                }
                            }}
                        >
                            Eliminar
                        </Button>
                    ) : (
                        <span />
                    )}
                    <Button type="submit">Guardar</Button>
                </>
            }
        >
            <TextField label="Nombre" placeholder="ej. Álgebra Lineal" {...register('name')} />
            <SelectField
                label="Grupo"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                options={groups.map((g) => ({ value: g.id, label: g.name }))}
            />
            <div>
                <div className="pl-field__label">Color</div>
                <HuePicker value={hue} onChange={(h) => setValue('hue', h)} />
            </div>
        </Modal>
    );
}
