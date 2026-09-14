/**
 * Single-user session: a shared password unlocks an HMAC-signed cookie.
 * Web Crypto only, so the same helpers run in middleware (Edge) and route handlers (Node).
 */

export const SESSION_COOKIE = 'planner_session';

/** How long a login lasts before the cookie has to be re-earned. */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
    let binary = '';
    for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(message: string, secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    return toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

/** Compares without leaking where the mismatch is. */
function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

/** Fail closed: a deployment missing its secrets locks everyone out rather than letting everyone in. */
function secrets(): { secret: string; password: string } | null {
    const secret = process.env.AUTH_SECRET;
    const password = process.env.APP_PASSWORD;
    if (!secret || !password) return null;
    return { secret, password };
}

export async function checkPassword(input: string): Promise<boolean> {
    const env = secrets();
    if (!env) return false;
    // Hashing both sides first keeps the comparison constant-time in length too.
    return safeEqual(await hmac(input, env.secret), await hmac(env.password, env.secret));
}

/** Token is `<expiry>.<signature>`; the expiry is inside the signed payload so it can't be extended. */
export async function createSessionToken(): Promise<string | null> {
    const env = secrets();
    if (!env) return null;
    const expiresAt = String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
    return `${expiresAt}.${await hmac(expiresAt, env.secret)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
    const env = secrets();
    if (!env || !token) return false;
    const [expiresAt, signature] = token.split('.');
    if (!expiresAt || !signature) return false;
    if (!Number.isFinite(Number(expiresAt)) || Number(expiresAt) < Date.now()) return false;
    return safeEqual(signature, await hmac(expiresAt, env.secret));
}
