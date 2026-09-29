import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TolerancePreview } from './TolerancePreview';
import { getTolerancePreviewLayout } from '../utils/tolerancePreview';

describe('TolerancePreview', () => {
  it('renders the green in-range band and both red blocked zones', () => {
    render(<TolerancePreview toleranciaPct={20} />);

    expect(screen.getByTestId('preview-ok-band')).toBeInTheDocument();
    expect(screen.getByTestId('preview-blocked-lower')).toBeInTheDocument();
    expect(screen.getByTestId('preview-blocked-upper')).toBeInTheDocument();
    expect(screen.getByTestId('preview-ideal-marker')).toBeInTheDocument();
  });

  it.each([
    [0, 'Se bloquea por debajo del 100% del mínimo y por encima del 100% del máximo'],
    [20, 'Se bloquea por debajo del 80% del mínimo y por encima del 120% del máximo'],
    [12.5, 'Se bloquea por debajo del 87,5% del mínimo y por encima del 112,5% del máximo'],
    [50, 'Se bloquea por debajo del 50% del mínimo y por encima del 150% del máximo'],
  ])('shows the blocking caption for %s%%', (pct, caption) => {
    render(<TolerancePreview toleranciaPct={pct} />);

    expect(screen.getByText(caption)).toBeInTheDocument();
  });

  it('updates the caption when the prop changes (20 -> 40) without saving', () => {
    const { rerender } = render(<TolerancePreview toleranciaPct={20} />);
    rerender(<TolerancePreview toleranciaPct={40} />);

    expect(
      screen.getByText('Se bloquea por debajo del 60% del mínimo y por encima del 140% del máximo'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/80% del mínimo/)).not.toBeInTheDocument();
  });

  it.each([0, 12.5, 25, 50])('positions the block markers from the layout function at %s%%', (pct) => {
    render(<TolerancePreview toleranciaPct={pct} />);
    const layout = getTolerancePreviewLayout(pct);

    expect(screen.getByTestId('preview-block-lower').style.left).toBe(`${layout.lowerBlockLeft}%`);
    expect(screen.getByTestId('preview-block-upper').style.left).toBe(`${layout.upperBlockLeft}%`);
  });
});
