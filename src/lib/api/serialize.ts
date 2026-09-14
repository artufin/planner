/**
 * Date <-> string conversion for the API layer. Server-only in practice (only route handlers
 * call these), but kept dependency-free so nothing stops it from being imported anywhere.
 *
 * Postgres `DATE`/`TIME` columns round-trip through Prisma as JS `Date` objects (`TIME` on the
 * epoch date, 1970-01-01), matching the model.md decision to keep the wire format as plain
 * 'YYYY-MM-DD' / 'HH:MM' strings and do the conversion in one shared place.
 */

export function toDateOnly(d: Date): string {
    return d.toISOString().slice(0, 10);
}

export function toDateOnlyNullable(d: Date | null): string | null {
    return d ? toDateOnly(d) : null;
}

export function toTimeOnly(d: Date): string {
    return d.toISOString().slice(11, 16);
}

export function toTimeOnlyNullable(d: Date | null): string | null {
    return d ? toTimeOnly(d) : null;
}

export function fromDateOnly(s: string): Date {
    return new Date(`${s}T00:00:00.000Z`);
}

export function fromDateOnlyNullable(s: string | null | undefined): Date | null {
    return s ? fromDateOnly(s) : null;
}

export function fromTimeOnly(s: string): Date {
    return new Date(`1970-01-01T${s}:00.000Z`);
}

export function fromTimeOnlyNullable(s: string | null | undefined): Date | null {
    return s ? fromTimeOnly(s) : null;
}
