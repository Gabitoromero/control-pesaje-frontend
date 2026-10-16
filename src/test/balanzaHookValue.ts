import { vi } from 'vitest';
import type { useBalanzaWebSocket } from '../features/tablet/hooks/useBalanzaWebSocket';

/**
 * Complete return value for a mocked `useBalanzaWebSocket`, so page tests only
 * state the fields they care about and keep compiling when the hook grows.
 */
export function makeBalanzaHookValue(
  overrides: Partial<ReturnType<typeof useBalanzaWebSocket>> = {},
): ReturnType<typeof useBalanzaWebSocket> {
  return {
    pesoNeto: 0,
    isConnected: true,
    hardwareId: undefined,
    unidad: undefined,
    socketConectado: true,
    enviarReporteSinPeso: vi.fn(() => Promise.resolve({ ok: true, code: 'sent' } as const)),
    ...overrides,
  };
}
