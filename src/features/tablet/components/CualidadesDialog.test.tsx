import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CualidadesDialog } from './CualidadesDialog';
import type { AtributoEtapa } from '../../../shared/types/domain';

const temperatura: AtributoEtapa = { id: 100, nombre: 'Temperatura (°C)', tipo: 'numerico', minimo: 0, maximo: 99 };
const degustacion: AtributoEtapa = { id: 101, nombre: 'Degustación', tipo: 'aceptado', minimo: 1, maximo: 1 };

const setup = (atributos: AtributoEtapa[], onSubmit = vi.fn().mockResolvedValue(undefined)) => {
  render(<CualidadesDialog etapaNombre="Amasado" atributos={atributos} onSubmit={onSubmit} />);
  return { onSubmit, guardar: () => screen.getByRole('button', { name: 'Guardar cualidades' }) };
};

describe('CualidadesDialog', () => {
  it('is a modal dialog named after the etapa with no way to dismiss it', () => {
    setup([temperatura]);
    const dialog = screen.getByRole('dialog', { name: 'Cualidades de Amasado' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.queryByRole('button', { name: /cerrar|cancelar|omitir/i })).not.toBeInTheDocument();
  });

  it('shows a number input with its accepted range for a numeric cualidad, and Guardar stays disabled until filled', async () => {
    const { guardar } = setup([temperatura]);
    expect(screen.getByText('Rango aceptado: 0 a 99')).toBeInTheDocument();
    expect(guardar()).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Temperatura (°C)'), '37.5');
    expect(guardar()).toBeEnabled();
  });

  it('shows Aceptado / No aceptado (never 1 or 0) for an aceptado cualidad', async () => {
    const { onSubmit, guardar } = setup([degustacion]);
    expect(screen.getByRole('radio', { name: 'Aceptado' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'No aceptado' })).toBeInTheDocument();
    expect(screen.queryByText(/^[01]$/)).not.toBeInTheDocument();
    expect(guardar()).toBeDisabled();

    await userEvent.click(screen.getByRole('radio', { name: 'No aceptado' }));
    await userEvent.click(guardar());
    expect(onSubmit).toHaveBeenCalledWith([{ atributoId: 101, valor: 0 }]);
  });

  it('submits every value at once: numeric as typed and Aceptado as 1', async () => {
    const { onSubmit, guardar } = setup([temperatura, degustacion]);
    await userEvent.type(screen.getByLabelText('Temperatura (°C)'), '12.5');
    expect(guardar()).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: 'Aceptado' }));
    await userEvent.click(guardar());

    expect(onSubmit).toHaveBeenCalledWith([
      { atributoId: 100, valor: 12.5 },
      { atributoId: 101, valor: 1 },
    ]);
  });

  it('accepts 0 as a valid numeric value', async () => {
    const { onSubmit, guardar } = setup([temperatura]);
    await userEvent.type(screen.getByLabelText('Temperatura (°C)'), '0');
    await userEvent.click(guardar());
    expect(onSubmit).toHaveBeenCalledWith([{ atributoId: 100, valor: 0 }]);
  });

  it('warns about an out-of-range number without blocking the save', async () => {
    const { onSubmit, guardar } = setup([temperatura]);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Temperatura (°C)'), '120');
    expect(screen.getByRole('status')).toHaveTextContent(/fuera del rango aceptado/i);
    expect(guardar()).toBeEnabled();
    await userEvent.click(guardar());
    expect(onSubmit).toHaveBeenCalledWith([{ atributoId: 100, valor: 120 }]);
  });

  it('keeps the dialog open with an error when saving fails, and lets the operator retry', async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(undefined);
    const { guardar } = setup([temperatura], onSubmit);
    await userEvent.type(screen.getByLabelText('Temperatura (°C)'), '10');

    await userEvent.click(guardar());
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron guardar las cualidades');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(guardar());
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
