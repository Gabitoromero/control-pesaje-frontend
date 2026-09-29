import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToleranceStatus } from './ToleranceStatus';

describe('ToleranceStatus', () => {
  it('shows the loading text while the tolerance is loading', () => {
    render(<ToleranceStatus tolerance={{ status: 'loading' }} />);
    expect(screen.getByText('Cargando tolerancia de peso...')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the error text and a Reintentar button that calls retry', async () => {
    const retry = vi.fn();
    render(<ToleranceStatus tolerance={{ status: 'unavailable', isRetrying: false, retry }} />);
    expect(screen.getByText('No se pudo obtener la tolerancia de peso.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('shows a disabled "Reintentando..." button while retrying', () => {
    render(<ToleranceStatus tolerance={{ status: 'unavailable', isRetrying: true, retry: vi.fn() }} />);
    expect(screen.getByRole('button', { name: 'Reintentando...' })).toBeDisabled();
  });

  it('renders nothing when the tolerance is ready (even if stale)', () => {
    const { container } = render(
      <ToleranceStatus tolerance={{ status: 'ready', toleranciaPct: 20, isStale: true }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
