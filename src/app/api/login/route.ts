import { NextResponse } from 'next/server';
import { z } from 'zod';
import { zodErrorResponse } from '@/lib/api/errors';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, checkPassword, createSessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);

    if (!(await checkPassword(parsed.data.password))) {
        return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const token = await createSessionToken();
    if (!token) return NextResponse.json({ error: 'Auth no configurada en el servidor' }, { status: 500 });

    const res = new NextResponse(null, { status: 204 });
    res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return res;
}

export async function DELETE() {
    const res = new NextResponse(null, { status: 204 });
    res.cookies.delete(SESSION_COOKIE);
    return res;
}
