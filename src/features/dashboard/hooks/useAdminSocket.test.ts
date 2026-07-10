import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdminSocket } from './useAdminSocket';
import { getSocket } from '../../../services/websocket';

vi.mock('../../../services/websocket', () => ({
  getSocket: vi.fn(),
}));

describe('useAdminSocket', () => {
  let listeners: Record<string, (...args: unknown[]) => void>;
  let mockSocket: {
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    listeners = {};
    mockSocket = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        listeners[event] = handler;
      }),
      off: vi.fn(),
    };
    vi.mocked(getSocket).mockReturnValue(mockSocket as unknown as ReturnType<typeof getSocket>);
  });

  it('connects the socket on mount', () => {
    renderHook(() => useAdminSocket());
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  });

  it('starts with an empty unassignedDevices list', () => {
    const { result } = renderHook(() => useAdminSocket());
    expect(result.current.unassignedDevices).toEqual([]);
  });

  it('adds a hardwareId when unknown-device-connected fires', () => {
    const { result } = renderHook(() => useAdminSocket());

    act(() => {
      listeners['unknown-device-connected']({ hardwareId: 'rpi-abc' });
    });

    expect(result.current.unassignedDevices).toEqual(['rpi-abc']);
  });

  it('does not duplicate an already-tracked hardwareId', () => {
    const { result } = renderHook(() => useAdminSocket());

    act(() => {
      listeners['unknown-device-connected']({ hardwareId: 'rpi-abc' });
    });
    act(() => {
      listeners['unknown-device-connected']({ hardwareId: 'rpi-abc' });
    });

    expect(result.current.unassignedDevices).toEqual(['rpi-abc']);
  });

  it('stacks distinct hardwareIds independently', () => {
    const { result } = renderHook(() => useAdminSocket());

    act(() => {
      listeners['unknown-device-connected']({ hardwareId: 'rpi-abc' });
    });
    act(() => {
      listeners['unknown-device-connected']({ hardwareId: 'rpi-xyz' });
    });

    expect(result.current.unassignedDevices).toEqual(['rpi-abc', 'rpi-xyz']);
  });

  it('resolveDevice removes the matching hardwareId', () => {
    const { result } = renderHook(() => useAdminSocket());

    act(() => {
      listeners['unknown-device-connected']({ hardwareId: 'rpi-abc' });
    });
    act(() => {
      listeners['unknown-device-connected']({ hardwareId: 'rpi-xyz' });
    });
    act(() => {
      result.current.resolveDevice('rpi-abc');
    });

    expect(result.current.unassignedDevices).toEqual(['rpi-xyz']);
  });

  it('disconnects and removes the listener on unmount', () => {
    const { unmount } = renderHook(() => useAdminSocket());
    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('unknown-device-connected', expect.any(Function));
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  });
});
