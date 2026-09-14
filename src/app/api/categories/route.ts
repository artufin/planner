import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { categoryDto } from '@/lib/api/dto';
import { prismaErrorResponse, zodErrorResponse } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(categories.map(categoryDto));
}

const createCategorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    hue: z.number().min(0).max(360),
    groupId: z.string().nullable(),
});

export async function POST(req: Request) {
    const parsed = createCategorySchema.safeParse(await req.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);
    try {
        const category = await prisma.category.create({ data: parsed.data });
        return NextResponse.json(categoryDto(category), { status: 201 });
    } catch (error) {
        return prismaErrorResponse(error);
    }
}
