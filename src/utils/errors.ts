import axios from 'axios';

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message
      ?? err.response?.data?.message
      ?? err.message
      ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

/**
 * Field-level reasons of a 400 "Validation error" (`error.details` = Zod issues).
 * `datosAdicionales.sector` is reported as `sector`, the name of its form field.
 * Only the first reason of each field is kept.
 */
export function getApiFieldErrors(err: unknown): ApiFieldError[] {
  if (!axios.isAxiosError(err)) return [];
  const details: unknown = err.response?.data?.error?.details;
  if (!Array.isArray(details)) return [];

  const byField = new Map<string, string>();
  for (const issue of details) {
    const path: unknown = issue?.path;
    const message: unknown = issue?.message;
    if (!Array.isArray(path) || path.length === 0 || typeof message !== 'string') continue;
    const field = path[0] === 'datosAdicionales' && path[1] === 'sector' ? 'sector' : String(path[0]);
    if (!byField.has(field)) byField.set(field, message);
  }
  return [...byField].map(([field, message]) => ({ field, message }));
}
