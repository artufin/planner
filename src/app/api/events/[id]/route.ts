import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { plannerEventDto } from '@/lib/api/dto';
import { prismaErrorResponse, zodErrorResponse } from '@/lib/api/errors';
import { fromDateOnly, fromTimeOnlyNullable } from '@/lib/api/serialize';
import { dateOnly, timeOnly } from '@/lib/api/validators';

export const dynamic = 'force-dynamic';

const updateEventSchema = z.object({
    categoryId: z.string().min(1).nullable().optional(),
    title: z.string().min(1).optional(),
    location: z.string().nullable().optional(),
    startDate: dateOnly.optional(),
    endDate: dateOnly.optional(),
    start: timeOnly.nullable().optional(),
    end: timeOnly.nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const parsed = updateEventSchema.safeParse(await req.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const v = parsed.data;
    try {
        const event = await prisma.plannerEvent.update({
            where: { id },
            data: {
                categoryId: v.categoryId,
                title: v.title,
                location: v.location,
                startDate: v.startDate !== undefined ? fromDateOnly(v.startDate) : undefined,
                endDate: v.endDate !== undefined ? fromDateOnly(v.endDate) : undefined,
                start: v.start !== undefined ? fromTimeOnlyNullable(v.start) : undefined,
                end: v.end !== undefined ? fromTimeOnlyNullable(v.end) : undefined,
            },
        });
        return NextResponse.json(plannerEventDto(event));
    } catch (error) {
        return prismaErrorResponse(error);
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        // Linked tasks keep their row with eventId cleared (SetNull) at the DB level.
        await prisma.plannerEvent.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return prismaErrorResponse(error);
    }
}
