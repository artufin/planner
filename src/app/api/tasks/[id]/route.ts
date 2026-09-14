import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { plannerTaskDto } from '@/lib/api/dto';
import { prismaErrorResponse, zodErrorResponse } from '@/lib/api/errors';
import { fromDateOnlyNullable, fromTimeOnlyNullable } from '@/lib/api/serialize';
import { dateOnly, timeOnly } from '@/lib/api/validators';

export const dynamic = 'force-dynamic';

const updateTaskSchema = z.object({
    categoryId: z.string().min(1).optional(),
    eventId: z.string().nullable().optional(),
    title: z.string().min(1).optional(),
    assignedDate: dateOnly.nullable().optional(),
    deadline: dateOnly.nullable().optional(),
    start: timeOnly.nullable().optional(),
    end: timeOnly.nullable().optional(),
    done: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const parsed = updateTaskSchema.safeParse(await req.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const v = parsed.data;
    try {
        const task = await prisma.plannerTask.update({
            where: { id },
            data: {
                categoryId: v.categoryId,
                eventId: v.eventId,
                title: v.title,
                assignedDate: v.assignedDate !== undefined ? fromDateOnlyNullable(v.assignedDate) : undefined,
                deadline: v.deadline !== undefined ? fromDateOnlyNullable(v.deadline) : undefined,
                start: v.start !== undefined ? fromTimeOnlyNullable(v.start) : undefined,
                end: v.end !== undefined ? fromTimeOnlyNullable(v.end) : undefined,
                done: v.done,
            },
        });
        return NextResponse.json(plannerTaskDto(task));
    } catch (error) {
        return prismaErrorResponse(error);
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await prisma.plannerTask.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return prismaErrorResponse(error);
    }
}
