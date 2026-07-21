import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useActividadHeartbeat, resolveHeartbeatInterval } from './useActividadHeartbeat';
import { actualizarActividad } from '../../../api/auth';

vi.mock('../../../api/auth', () => ({
  actualizarActividad: vi.fn().mockResolvedValue(undefined),
}));

describe('resolveHeartbeatInterval', () => {
  it('devuelve el valor del env cuando es un número positivo válido', () => {
    expect(resolveHeartbeatInterval('5000')).toBe(5000);
  });

  it('devuelve el default (120000) cuando el env es undefined', () => {
    expect(resolveHeartbeatInterval(undefined)).toBe(120000);
  });

  it('devuelve el default cuando el env no es un número finito positivo', () => {
    expect(resolveHeartbeatInterval('abc')).toBe(120000);
    expect(resolveHeartbeatInterval('0')).toBe(120000);
    expect(resolveHeartbeatInterval('-100')).toBe(120000);
  });
});

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
