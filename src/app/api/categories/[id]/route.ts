import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { categoryDto } from '@/lib/api/dto';
import { prismaErrorResponse, zodErrorResponse } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

const updateCategorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').optional(),
    hue: z.number().min(0).max(360).optional(),
    groupId: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const parsed = updateCategorySchema.safeParse(await req.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);
    try {
        const category = await prisma.category.update({ where: { id }, data: parsed.data });
        return NextResponse.json(categoryDto(category));
    } catch (error) {
        return prismaErrorResponse(error);
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        // Cascades to schedule/exceptions/events/tasks at the DB level.
        await prisma.category.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return prismaErrorResponse(error);
    }
}
