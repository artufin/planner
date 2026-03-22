// Generadores utiles

export function nowIso(): string {
    return new Date().toISOString();
}

export function generateId(): string {
    return crypto.randomUUID();
}

// Helpers para validación

export function assertNonEmpty(value: string, fieldName: string): void {
    if (!value || value.trim() === '') {
        throw new Error(`${fieldName} cannot be empty`);
    }
}

export function assertValidDate(value: string, fieldName: string): void {
    if (isNaN(Date.parse(value))) {
        throw new Error(`${fieldName} must be a valid date string`);
    }
}