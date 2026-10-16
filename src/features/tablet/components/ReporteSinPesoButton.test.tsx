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

    await userEvent.click(screen.getByRole('button', { name: 'No veo el peso: enviar reporte' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows the sending label and is disabled', () => {
    render(<ReporteSinPesoButton {...baseProps} estado="enviando" deshabilitado />);
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
  });

  it('shows the remaining seconds while cooling down', () => {
    render(<ReporteSinPesoButton {...baseProps} estado="enfriamiento" segundosRestantes={42} deshabilitado />);
    expect(screen.getByRole('button', { name: 'Reportar de nuevo en 42 s' })).toBeDisabled();
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
    const button = screen.getByRole('button', { name: 'No veo el peso: enviar reporte' });
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

  it('shows the alert emoji and explains the diagnostic report in its title', () => {
    render(<ReporteSinPesoButton {...baseProps} />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('⚠️ No veo el peso');
    expect(button).toHaveAttribute('title', expect.stringMatching(/reporte de diagn/i));
  });

  it('applies the className passed by the caller to its root', () => {
    const { container } = render(<ReporteSinPesoButton {...baseProps} className="absolute top-0 right-0" />);
    expect(container.firstChild).toHaveClass('absolute', 'top-0', 'right-0');
  });

  it.each([
    ['primary', 'border-primary'],
    ['warning', 'border-warning'],
  ] as const)('applies the %s variant accent', (variant, cls) => {
    render(<ReporteSinPesoButton {...baseProps} variant={variant} />);
    expect(screen.getByRole('button')).toHaveClass(cls);
  });
});
