import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { plannerEventDto } from '@/lib/api/dto';
import { prismaErrorResponse } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const original = await prisma.plannerEvent.findUniqueOrThrow({ where: { id } });
        const copy = await prisma.plannerEvent.create({
            data: {
                categoryId: original.categoryId,
                title: `${original.title} (copia)`,
                startDate: original.startDate,
                endDate: original.endDate,
                start: original.start,
                end: original.end,
            },
        });
        return NextResponse.json(plannerEventDto(copy), { status: 201 });
    } catch (error) {
        return prismaErrorResponse(error);
    }
}
