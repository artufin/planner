import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

export function zodErrorResponse(error: ZodError) {
    return NextResponse.json({ error: 'Datos inválidos', issues: error.issues }, { status: 400 });
}

interface PrismaErrorMessages {
    notFound?: string;
    /** P2003 — a restricted foreign key still references this row. */
    conflict?: string;
    /** P2002 — a unique constraint was violated. */
    duplicate?: string;
}

export function prismaErrorResponse(error: unknown, messages?: PrismaErrorMessages) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: messages?.notFound ?? 'No encontrado' }, { status: 404 });
        }
        if (error.code === 'P2003') {
            return NextResponse.json({ error: messages?.conflict ?? 'Referenciado por otros registros' }, { status: 409 });
        }
        if (error.code === 'P2002') {
            return NextResponse.json({ error: messages?.duplicate ?? 'Ya existe' }, { status: 409 });
        }
    }
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
}
