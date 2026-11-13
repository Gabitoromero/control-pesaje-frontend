import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { LineaObservacionBanner } from './LineaObservacionBanner';

const LONG = 'Línea reservada para lote especial. '.repeat(10);

describe('LineaObservacionBanner', () => {
  it('renders nothing without observation', () => {
    const { container } = render(<LineaObservacionBanner observacion={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the full observation by default', () => {
    render(<LineaObservacionBanner observacion={LONG} />);
    expect(screen.getByText(LONG.trim())).not.toHaveClass('line-clamp-1');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  describe('compact', () => {
    it('clamps the observation to one line and keeps the full text available', () => {
      render(<LineaObservacionBanner observacion={LONG} compact />);
      const text = screen.getByText(LONG.trim());
      expect(text).toHaveClass('line-clamp-1');
    });

    it('expands and collapses the observation on tap', async () => {
      const user = userEvent.setup();
      render(<LineaObservacionBanner observacion={LONG} compact />);
      const toggle = screen.getByRole('button', { name: /observación de la línea/i });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText(LONG.trim())).not.toHaveClass('line-clamp-1');

      await user.click(toggle);
      expect(screen.getByText(LONG.trim())).toHaveClass('line-clamp-1');
    });
  });
});
