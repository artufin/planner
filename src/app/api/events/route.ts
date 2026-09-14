import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { plannerEventDto } from '@/lib/api/dto';
import { prismaErrorResponse, zodErrorResponse } from '@/lib/api/errors';
import { fromDateOnly, fromTimeOnlyNullable } from '@/lib/api/serialize';
import { dateOnly, timeOnly } from '@/lib/api/validators';

export const dynamic = 'force-dynamic';

export async function GET() {
    const events = await prisma.plannerEvent.findMany();
    return NextResponse.json(events.map(plannerEventDto));
}

const createEventSchema = z.object({
    categoryId: z.string().min(1).nullable().default(null),
    title: z.string().min(1, 'El título es requerido'),
    location: z.string().nullable().default(null),
    startDate: dateOnly,
    endDate: dateOnly,
    start: timeOnly.nullable().default(null),
    end: timeOnly.nullable().default(null),
});

export async function POST(req: Request) {
    const parsed = createEventSchema.safeParse(await req.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const v = parsed.data;
    try {
        const event = await prisma.plannerEvent.create({
            data: {
                categoryId: v.categoryId,
                title: v.title,
                location: v.location,
                startDate: fromDateOnly(v.startDate),
                endDate: fromDateOnly(v.endDate),
                start: fromTimeOnlyNullable(v.start),
                end: fromTimeOnlyNullable(v.end),
            },
        });
        return NextResponse.json(plannerEventDto(event), { status: 201 });
    } catch (error) {
        return prismaErrorResponse(error);
    }
}
