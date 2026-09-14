import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { scheduleItemDto } from '@/lib/api/dto';
import { prismaErrorResponse, zodErrorResponse } from '@/lib/api/errors';
import { fromDateOnly, fromDateOnlyNullable, fromTimeOnly } from '@/lib/api/serialize';
import { dateOnly, timeOnly } from '@/lib/api/validators';

export const dynamic = 'force-dynamic';

const updateScheduleSchema = z.object({
    categoryId: z.string().min(1).optional(),
    title: z.string().optional(),
    weekday: z.number().int().min(0).max(6).optional(),
    start: timeOnly.optional(),
    end: timeOnly.optional(),
    startDate: dateOnly.optional(),
    endDate: dateOnly.nullable().optional(),
    interval: z.union([z.literal(1), z.literal(2)]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const parsed = updateScheduleSchema.safeParse(await req.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const v = parsed.data;
    try {
        const item = await prisma.scheduleItem.update({
            where: { id },
            data: {
                categoryId: v.categoryId,
                title: v.title,
                weekday: v.weekday,
                start: v.start !== undefined ? fromTimeOnly(v.start) : undefined,
                end: v.end !== undefined ? fromTimeOnly(v.end) : undefined,
                startDate: v.startDate !== undefined ? fromDateOnly(v.startDate) : undefined,
                endDate: v.endDate !== undefined ? fromDateOnlyNullable(v.endDate) : undefined,
                interval: v.interval,
            },
        });
        return NextResponse.json(scheduleItemDto(item));
    } catch (error) {
        return prismaErrorResponse(error);
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        // Cascades to its exceptions at the DB level.
        await prisma.scheduleItem.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return prismaErrorResponse(error);
    }
}
