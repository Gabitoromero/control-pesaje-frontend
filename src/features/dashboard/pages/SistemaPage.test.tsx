import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../test/render';
import { SistemaPage } from './SistemaPage';

describe('SistemaPage tolerance copy', () => {
  it('describes the tolerance as configurable instead of a fixed 20%', () => {
    const { container } = renderWithProviders(<SistemaPage />);
    const text = container.textContent ?? '';

    expect(text).toMatch(/porcentaje de tolerancia configurado por un Administrador/);
    expect(text).toMatch(/Parametrización → Muestras/);
    expect(text).not.toMatch(/20\s*%\s*del rango/);
  });
});
