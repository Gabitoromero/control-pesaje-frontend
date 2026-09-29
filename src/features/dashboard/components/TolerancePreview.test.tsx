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

  it('shows the caption with the blocking limits for 20%', () => {
    render(<TolerancePreview toleranciaPct={20} />);

    expect(
      screen.getByText('Se bloquea el registro por debajo de 72 y por encima de 132'),
    ).toBeInTheDocument();
  });

  it('updates the caption when the prop changes (20 -> 40) without saving', () => {
    const { rerender } = render(<TolerancePreview toleranciaPct={20} />);
    rerender(<TolerancePreview toleranciaPct={40} />);

    expect(
      screen.getByText('Se bloquea el registro por debajo de 54 y por encima de 154'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/por debajo de 72/)).not.toBeInTheDocument();
  });

  it('formats decimal limits with the Spanish locale', () => {
    render(<TolerancePreview toleranciaPct={12.5} />);

    // 90 * 0.875 = 78.75 ; 110 * 1.125 = 123.75
    expect(
      screen.getByText('Se bloquea el registro por debajo de 78,75 y por encima de 123,75'),
    ).toBeInTheDocument();
  });

  it('positions the block markers from the layout function', () => {
    render(<TolerancePreview toleranciaPct={20} />);
    const layout = getTolerancePreviewLayout(20);

    expect(screen.getByTestId('preview-block-lower').style.left).toBe(`${layout.lowerBlockLeft}%`);
    expect(screen.getByTestId('preview-block-upper').style.left).toBe(`${layout.upperBlockLeft}%`);
  });
});
