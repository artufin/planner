import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
    if (await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

    // The API is the real door: blocking only the UI would leave every route open to a direct fetch.
    if (req.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: ['/((?!login|api/login|_next/static|_next/image|favicon.ico).*)'],
};
