import '@testing-library/jest-dom';

/**
 * jsdom does not implement `window.matchMedia`. Provide a default mock so
 * any test exercising theme resolution (or components depending on
 * `matchMedia`) does not throw `TypeError: matchMedia is not a function`.
 *
 * Default resolves `matches: false` for every query. Tests that need to
 * simulate an OS dark-mode preference should override it via
 * `mockMatchMedia(true)`.
 */
export function mockMatchMedia(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

mockMatchMedia(false);

import { vi } from 'vitest';
vi.mock('../features/dashboard/hooks/useActividadGlobal', () => ({
  useActividadGlobal: () => ({
    hayActividad: false,
    pasadas: [],
    sesiones: [],
    isLoading: false,
  })
}));

/**
 * jsdom does not implement `Element.prototype.scrollIntoView`. Provide a
 * no-op default so components exercising scroll-into-view behavior (e.g.
 * auto-centering the active step in a stepper) do not throw
 * `TypeError: scrollIntoView is not a function`.
 *
 * Individual tests spy on `Element.prototype.scrollIntoView` via
 * `vi.spyOn` to assert call arguments.
 */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

/**
 * jsdom does not implement `ResizeObserver`. cmdk (used by SearchableCombobox)
 * relies on it. Provide a minimal stub so tests don't crash.
 */
if (typeof ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
