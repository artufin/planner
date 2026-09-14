import { z } from 'zod';

export const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida');
export const timeOnly = z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida');
