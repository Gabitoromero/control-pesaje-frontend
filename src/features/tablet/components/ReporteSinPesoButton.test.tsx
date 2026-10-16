import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ReporteSinPesoButton, type ReporteSinPesoButtonProps } from './ReporteSinPesoButton';

const baseProps: ReporteSinPesoButtonProps = {
  estado: 'idle',
  segundosRestantes: 0,
  deshabilitado: false,
  onClick: () => {},
  variant: 'primary',
};

describe('ReporteSinPesoButton', () => {
  it('shows the idle label and calls onClick when pressed', async () => {
    const onClick = vi.fn();
    render(<ReporteSinPesoButton {...baseProps} onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'No veo el peso' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows the sending label and is disabled', () => {
    render(<ReporteSinPesoButton {...baseProps} estado="enviando" deshabilitado />);
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
  });

  it('shows the remaining seconds while cooling down', () => {
    render(<ReporteSinPesoButton {...baseProps} estado="enfriamiento" segundosRestantes={42} deshabilitado />);
    expect(screen.getByRole('button', { name: 'Podrá reportar nuevamente en 42 s' })).toBeDisabled();
  });

  it('shows why it is disabled and does not call onClick', async () => {
    const onClick = vi.fn();
    render(
      <ReporteSinPesoButton
        {...baseProps}
        deshabilitado
        motivoDeshabilitado="Sin conexión con el servidor"
        onClick={onClick}
      />,
    );

    expect(screen.getByText('Sin conexión con el servidor')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'No veo el peso' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders no reason message when enabled', () => {
    render(<ReporteSinPesoButton {...baseProps} />);
    expect(screen.queryByRole('status')).toBeEmptyDOMElement();
  });

  it('exposes the reason in a polite live region', () => {
    render(<ReporteSinPesoButton {...baseProps} deshabilitado motivoDeshabilitado="Sin conexión con el servidor" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Sin conexión con el servidor');
  });

  it.each([
    ['primary', 'border-primary'],
    ['warning', 'border-warning'],
  ] as const)('applies the %s variant accent', (variant, cls) => {
    render(<ReporteSinPesoButton {...baseProps} variant={variant} />);
    expect(screen.getByRole('button')).toHaveClass(cls);
  });
});
