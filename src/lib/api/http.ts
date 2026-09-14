export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new ApiError(res.status, body?.error ?? res.statusText);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}

export const http = {
    get: <T>(url: string) => request<T>(url),
    post: <T>(url: string, body?: unknown) =>
        request<T>(url, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
    put: <T>(url: string, body?: unknown) =>
        request<T>(url, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
    patch: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};

export function apiErrorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : 'Ocurrió un error inesperado';
}
