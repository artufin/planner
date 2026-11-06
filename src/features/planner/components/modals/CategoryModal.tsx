'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, HuePicker, Modal, SelectField, TextField, suggestHue } from '@planner/ui';
import { usePlannerStore } from '../../store';
import { useCategories, useCreateCategory, useUpdateCategory } from '@/lib/api/categories';
import { useGroups } from '@/lib/api/groups';
import { toast } from '../../toast/toast';
import DeleteCategoryDialog from '../DeleteCategoryDialog';
import { categoryFormSchema, type CategoryFormValues } from '../../schemas';

export default function CategoryModal() {
    const { data: categories = [] } = useCategories();
    const { data: groups = [] } = useGroups();
    const categoryModal = usePlannerStore((s) => s.categoryModal);
    const closeCategoryModal = usePlannerStore((s) => s.closeCategoryModal);
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const view = usePlannerStore((s) => s.view);
    const selectedCategoryId = usePlannerStore((s) => s.selectedCategoryId);
    const goToCategoriesList = usePlannerStore((s) => s.goToCategoriesList);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const editingCategory = categoryModal.editingId ? categories.find((c) => c.id === categoryModal.editingId) : undefined;

    const defaultValues = useMemo<CategoryFormValues>(() => {
        if (editingCategory) return { name: editingCategory.name, hue: editingCategory.hue };
        /** A new category starts on the palette color furthest from the ones already in use. */
        return { name: '', hue: suggestHue(categories.map((c) => c.hue)) };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { register, handleSubmit, watch, setValue } = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues,
    });

    const hue = watch('hue');
    const [groupId, setGroupId] = useState(editingCategory?.groupId ?? groups[0]?.id ?? '');

    const onSubmit = (values: CategoryFormValues) => {
        const onError = toast.error;
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
        <>
            <Modal
                asForm
                width={340}
                closeOnEscape={!confirmingDelete}
                title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
                onClose={closeCategoryModal}
                onSubmit={handleSubmit(onSubmit)}
                footer={
                    <>
                        {editingCategory ? (
                            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
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
                    <HuePicker
                        value={hue}
                        onChange={(h) => setValue('hue', h)}
                        used={categories.filter((c) => c.id !== editingCategory?.id).map((c) => ({ hue: c.hue, label: c.name }))}
                    />
                </div>
            </Modal>
            {confirmingDelete && editingCategory && (
                <DeleteCategoryDialog
                    category={editingCategory}
                    onCancel={() => setConfirmingDelete(false)}
                    onDeleted={() => {
                        closeCategoryModal();
                        // Its page would be empty now.
                        if (view === 'category' && selectedCategoryId === editingCategory.id) goToCategoriesList();
                    }}
                />
            )}
        </>
    );
}
