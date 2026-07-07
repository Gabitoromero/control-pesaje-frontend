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
