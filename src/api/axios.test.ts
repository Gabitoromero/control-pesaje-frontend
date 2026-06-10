import { describe, it, expect, vi, beforeEach } from 'vitest';
import api, { setLogoutHandler } from './axios';

describe('axios interceptor', () => {
  let logoutCalled = false;
  let originalWindowLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    logoutCalled = false;
    setLogoutHandler(() => { logoutCalled = true; });

    // mock window.location
    originalWindowLocation = window.location;
    // @ts-ignore
    delete window.location;
    window.location = { ...originalWindowLocation, href: '/' } as Location;
  });

  afterEach(() => {
    window.location = originalWindowLocation;
  });

  it('debe llamar a _logout y no fallar cuando status es 401, independientemente de la url', async () => {
    // Inject mock interceptor error
    const onRejected = (api.interceptors.response as any).handlers[0].rejected;
    
    let rejectedError = null;
    try {
      await onRejected({
        response: { status: 401 },
        config: { url: '/auth/sesion-linea' }
      });
    } catch (e) {
      rejectedError = e;
    }
    
    expect(logoutCalled).toBe(true);
    expect(rejectedError).toBeDefined();
  });

  it('no debe llamar a _logout para status 409', async () => {
    const onRejected = (api.interceptors.response as any).handlers[0].rejected;
    
    let rejectedError = null;
    try {
      await onRejected({
        response: { status: 409 },
        config: { url: '/auth/sesion-linea' }
      });
    } catch (e) {
      rejectedError = e;
    }
    
    expect(logoutCalled).toBe(false);
    expect(rejectedError).toBeDefined();
  });
});
