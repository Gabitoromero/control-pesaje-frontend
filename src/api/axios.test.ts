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
    // @ts-expect-error - overriding window location for tests
    delete window.location;
    // @ts-expect-error - window.location requires string & Location internally in some TS configs
    window.location = { ...originalWindowLocation, href: '/' } as unknown as Location;
  });

  afterEach(() => {
    // @ts-expect-error - restoring original window location
    window.location = originalWindowLocation;
  });

  it('debe llamar a _logout y no fallar cuando status es 401, independientemente de la url', async () => {
    // Inject mock interceptor error
    const onRejected = (api.interceptors.response as unknown as { handlers: Array<{ rejected: (err: unknown) => Promise<unknown> }> }).handlers[0].rejected;
    
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
    const onRejected = (api.interceptors.response as unknown as { handlers: Array<{ rejected: (err: unknown) => Promise<unknown> }> }).handlers[0].rejected;
    
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
