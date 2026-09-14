import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { groupDto } from '@/lib/api/dto';
import { prismaErrorResponse, zodErrorResponse } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
    const groups = await prisma.group.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(groups.map(groupDto));
}

const createGroupSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
});

export async function POST(req: Request) {
    const parsed = createGroupSchema.safeParse(await req.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);
    try {
        const group = await prisma.group.create({ data: parsed.data });
        return NextResponse.json(groupDto(group), { status: 201 });
    } catch (error) {
        return prismaErrorResponse(error);
    }
}
