import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { timeDivisionDto } from '@/lib/api/dto';
import { prismaErrorResponse, zodErrorResponse } from '@/lib/api/errors';
import { fromTimeOnly } from '@/lib/api/serialize';
import { timeOnly } from '@/lib/api/validators';

export const dynamic = 'force-dynamic';

/** The week view always needs at least a start/end gridline. */
const MIN_DIVISIONS = 2;

export async function GET() {
    const divisions = await prisma.timeDivision.findMany();
    return NextResponse.json(divisions.map(timeDivisionDto));
}

const createDivisionSchema = z.object({ value: timeOnly });

export async function POST(req: Request) {
    const parsed = createDivisionSchema.safeParse(await req.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const value = fromTimeOnly(parsed.data.value);
    try {
        // Idempotent: adding an existing value is a no-op, matching the store's `.includes` guard.
        const division = await prisma.timeDivision.upsert({ where: { value }, create: { value }, update: {} });
        return NextResponse.json(timeDivisionDto(division), { status: 201 });
    } catch (error) {
        return prismaErrorResponse(error);
    }
}

export async function DELETE(req: Request) {
    const rawValue = new URL(req.url).searchParams.get('value');
    const parsed = timeOnly.safeParse(rawValue);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    try {
        const count = await prisma.timeDivision.count();
        if (count <= MIN_DIVISIONS) {
            return NextResponse.json({ error: `Debe quedar al menos ${MIN_DIVISIONS} franjas horarias` }, { status: 409 });
        }
        await prisma.timeDivision.delete({ where: { value: fromTimeOnly(parsed.data) } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return prismaErrorResponse(error);
    }
}
