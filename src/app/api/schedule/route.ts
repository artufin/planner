import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { scheduleItemDto } from '@/lib/api/dto';
import { prismaErrorResponse, zodErrorResponse } from '@/lib/api/errors';
import { fromDateOnly, fromDateOnlyNullable, fromTimeOnly } from '@/lib/api/serialize';
import { dateOnly, timeOnly } from '@/lib/api/validators';

export const dynamic = 'force-dynamic';

export async function GET() {
    const items = await prisma.scheduleItem.findMany();
    return NextResponse.json(items.map(scheduleItemDto));
}

const createScheduleSchema = z.object({
    categoryId: z.string().min(1),
    title: z.string(),
    weekday: z.number().int().min(0).max(6),
    start: timeOnly,
    end: timeOnly,
    startDate: dateOnly,
    endDate: dateOnly.nullable(),
    interval: z.union([z.literal(1), z.literal(2)]),
});

export async function POST(req: Request) {
    const parsed = createScheduleSchema.safeParse(await req.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const v = parsed.data;
    try {
        const item = await prisma.scheduleItem.create({
            data: {
                categoryId: v.categoryId,
                title: v.title,
                weekday: v.weekday,
                start: fromTimeOnly(v.start),
                end: fromTimeOnly(v.end),
                startDate: fromDateOnly(v.startDate),
                endDate: fromDateOnlyNullable(v.endDate),
                interval: v.interval,
            },
        });
        return NextResponse.json(scheduleItemDto(item), { status: 201 });
    } catch (error) {
        return prismaErrorResponse(error);
    }
}
