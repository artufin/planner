import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { groupDto } from '@/lib/api/dto';
import { prismaErrorResponse, zodErrorResponse } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

const updateGroupSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const parsed = updateGroupSchema.safeParse(await req.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);
    try {
        const group = await prisma.group.update({ where: { id }, data: parsed.data });
        return NextResponse.json(groupDto(group));
    } catch (error) {
        return prismaErrorResponse(error);
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await prisma.group.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return prismaErrorResponse(error, {
            conflict: 'Este grupo tiene categorías asignadas. Muévelas a otro grupo primero.',
        });
    }
}
