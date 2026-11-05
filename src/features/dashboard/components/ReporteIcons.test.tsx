import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ReporteIcon, type ReporteIconTipo } from './ReporteIcons';

const TIPOS: ReporteIconTipo[] = ['muestras', 'pasadas', 'rutas'];

describe('ReporteIcon', () => {
  it('draws a distinct svg for each kind of report', () => {
    const dibujos = TIPOS.map((tipo) => {
      const { container, unmount } = render(<ReporteIcon tipo={tipo} active={false} />);
      const dibujo = container.querySelector('svg')?.getAttribute('data-icono');
      unmount();
      return dibujo;
    });
    expect(dibujos.every(Boolean)).toBe(true);
    expect(new Set(dibujos).size).toBe(3);
  });

  it('is decorative and exposes whether it is animating', () => {
    const { getByTestId, rerender } = render(<ReporteIcon tipo="rutas" active={false} />);
    const tile = getByTestId('reporte-icon-rutas');
    expect(tile).toHaveAttribute('aria-hidden', 'true');
    expect(tile).toHaveAttribute('data-active', 'false');

    rerender(<ReporteIcon tipo="rutas" active />);
    expect(tile).toHaveAttribute('data-active', 'true');
  });
});
