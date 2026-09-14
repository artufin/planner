import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { scheduleExceptionDto } from '@/lib/api/dto';
import { prismaErrorResponse, zodErrorResponse } from '@/lib/api/errors';
import { fromDateOnly, fromTimeOnlyNullable } from '@/lib/api/serialize';
import { dateOnly, timeOnly } from '@/lib/api/validators';

export const dynamic = 'force-dynamic';

export async function GET() {
    const exceptions = await prisma.scheduleException.findMany();
    return NextResponse.json(exceptions.map(scheduleExceptionDto));
}

/**
 * Upsert by (scheduleId, date) — same entry point the store used both to override an
 * occurrence and to cancel it. `title`/`start`/`end` always fully replace the previous
 * override (default to null rather than being left out), matching that the store never
 * merged a new exception into an old one — cancelling wipes any prior override.
 */
const upsertExceptionSchema = z.object({
    scheduleId: z.string().min(1),
    date: dateOnly,
    cancelled: z.boolean(),
    title: z.string().nullable().default(null),
    start: timeOnly.nullable().default(null),
    end: timeOnly.nullable().default(null),
});

export async function PUT(req: Request) {
    const parsed = upsertExceptionSchema.safeParse(await req.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const v = parsed.data;
    const date = fromDateOnly(v.date);
    try {
        const exception = await prisma.scheduleException.upsert({
            where: { scheduleId_date: { scheduleId: v.scheduleId, date } },
            create: {
                scheduleId: v.scheduleId,
                date,
                cancelled: v.cancelled,
                title: v.title,
                start: fromTimeOnlyNullable(v.start),
                end: fromTimeOnlyNullable(v.end),
            },
            update: {
                cancelled: v.cancelled,
                title: v.title,
                start: fromTimeOnlyNullable(v.start),
                end: fromTimeOnlyNullable(v.end),
            },
        });
        return NextResponse.json(scheduleExceptionDto(exception));
    } catch (error) {
        return prismaErrorResponse(error);
    }
}
