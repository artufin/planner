import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { plannerTaskDto } from '@/lib/api/dto';
import { prismaErrorResponse, zodErrorResponse } from '@/lib/api/errors';
import { fromDateOnlyNullable, fromTimeOnlyNullable } from '@/lib/api/serialize';
import { dateOnly, timeOnly } from '@/lib/api/validators';

export const dynamic = 'force-dynamic';

export async function GET() {
    const tasks = await prisma.plannerTask.findMany();
    return NextResponse.json(tasks.map(plannerTaskDto));
}

const createTaskSchema = z.object({
    categoryId: z.string().min(1),
    eventId: z.string().nullable().default(null),
    title: z.string().min(1, 'El título es requerido'),
    assignedDate: dateOnly.nullable().default(null),
    deadline: dateOnly.nullable().default(null),
    start: timeOnly.nullable().default(null),
    end: timeOnly.nullable().default(null),
    done: z.boolean().default(false),
});

export async function POST(req: Request) {
    const parsed = createTaskSchema.safeParse(await req.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const v = parsed.data;
    try {
        const task = await prisma.plannerTask.create({
            data: {
                categoryId: v.categoryId,
                eventId: v.eventId,
                title: v.title,
                assignedDate: fromDateOnlyNullable(v.assignedDate),
                deadline: fromDateOnlyNullable(v.deadline),
                start: fromTimeOnlyNullable(v.start),
                end: fromTimeOnlyNullable(v.end),
                done: v.done,
            },
        });
        return NextResponse.json(plannerTaskDto(task), { status: 201 });
    } catch (error) {
        return prismaErrorResponse(error);
    }
}
