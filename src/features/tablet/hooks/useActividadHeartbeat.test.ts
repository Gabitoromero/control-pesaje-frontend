import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useActividadHeartbeat } from './useActividadHeartbeat';
import { actualizarActividad } from '../../../api/auth';

vi.mock('../../../api/auth', () => ({
  actualizarActividad: vi.fn().mockResolvedValue(undefined),
}));

describe('useActividadHeartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no llama a la api si lineaId es null', () => {
    renderHook(() => useActividadHeartbeat(null));
    vi.advanceTimersByTime(120000);
    expect(actualizarActividad).not.toHaveBeenCalled();
  });

  it('llama a actualizarActividad cada 2 minutos cuando lineaId no es null', () => {
    renderHook(() => useActividadHeartbeat(5));
    
    // Al principio no lo llama
    expect(actualizarActividad).not.toHaveBeenCalled();
    
    // A los 2 minutos (120000ms)
    vi.advanceTimersByTime(120000);
    expect(actualizarActividad).toHaveBeenCalledTimes(1);

    // A los 4 minutos
    vi.advanceTimersByTime(120000);
    expect(actualizarActividad).toHaveBeenCalledTimes(2);
  });

  it('limpia el timer al desmontar', () => {
    const { unmount } = renderHook(() => useActividadHeartbeat(5));
    unmount();
    
    vi.advanceTimersByTime(120000);
    expect(actualizarActividad).not.toHaveBeenCalled();
  });
});
