import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StageAdvanceFlash } from './StageAdvanceFlash';

describe('StageAdvanceFlash', () => {
  it('renders the incoming stage name overlay on a forward advance', () => {
    render(<StageAdvanceFlash signal={{ kind: 'forward', etapaId: 20, nombre: 'Horneado' }} />);

    expect(screen.getByTestId('stage-advance-flash')).toBeInTheDocument();
    expect(screen.getByText('Horneado')).toBeInTheDocument();
  });

  it('renders nothing on a backward (regression) transition — spec: regression stays silent/non-alarming', () => {
    const { container } = render(
      <StageAdvanceFlash signal={{ kind: 'backward', etapaId: 10, nombre: 'Amasado' }} />
    );

    expect(screen.queryByTestId('stage-advance-flash')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there is no active signal', () => {
    const { container } = render(<StageAdvanceFlash signal={{ kind: 'none' }} />);

    expect(screen.queryByTestId('stage-advance-flash')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('marks the overlay as decorative for assistive technology (aria-hidden)', () => {
    render(<StageAdvanceFlash signal={{ kind: 'forward', etapaId: 20, nombre: 'Horneado' }} />);

    expect(screen.getByTestId('stage-advance-flash')).toHaveAttribute('aria-hidden', 'true');
  });
});
