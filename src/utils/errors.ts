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
