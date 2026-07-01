//import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MuestrasListPanel } from './MuestrasListPanel';
import type { Muestra } from '../../../shared/types/domain';

const makeMuestra = (overrides: Partial<Muestra> = {}): Muestra => ({
  id: 1,
  pesoNeto: 15.0,
  estadoValidacion: 'ok',
  usuarioId: 3,
  etapaId: 10,
  lineaProduccionId: 1,
  timestamp: new Date().toISOString(),
  ...overrides,
});

describe('MuestrasListPanel', () => {
  const onRemoveSample = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Empty state ───────────────────────────────────────────────────────────────

  it('renders default empty message when muestras is empty', () => {
    render(<MuestrasListPanel muestras={[]} onRemoveSample={onRemoveSample} />);
    expect(screen.getByText('No hay muestras registradas en esta sesión.')).toBeInTheDocument();
  });

  it('renders custom emptyMessage when provided and muestras is empty', () => {
    render(
      <MuestrasListPanel
        muestras={[]}
        onRemoveSample={onRemoveSample}
        emptyMessage="Lista vacía"
      />
    );
    expect(screen.getByText('Lista vacía')).toBeInTheDocument();
    expect(screen.queryByText('No hay muestras registradas en esta sesión.')).not.toBeInTheDocument();
  });

  // ── Row rendering ─────────────────────────────────────────────────────────────

  it('renders one row per muestra', () => {
    const muestras = [makeMuestra({ id: 1 }), makeMuestra({ id: 2 }), makeMuestra({ id: 3 })];
    render(<MuestrasListPanel muestras={muestras} onRemoveSample={onRemoveSample} />);
    // Each row has a delete button
    expect(screen.getAllByRole('button', { name: /eliminar/i })).toHaveLength(3);
  });

  it('shows sequential numbers oldest-first: first item in array = #1', () => {
    // Array has 3 items, index 0 is oldest so it gets #1, last item gets #3
    const muestras = [
      makeMuestra({ id: 10 }),
      makeMuestra({ id: 20 }),
      makeMuestra({ id: 30 }),
    ];
    render(<MuestrasListPanel muestras={muestras} onRemoveSample={onRemoveSample} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('shows stage name when etapas prop matches the muestra etapaId', () => {
    const etapas = [
      {
        etapa: { id: 10, nombre: 'Entrada' },
        orden: 1,
        pesoMinimo: 10,
        pesoIdeal: 15,
        pesoMaximo: 20,
        cantidadMuestrasRequeridas: 2,
      },
    ];
    const muestras = [makeMuestra({ etapaId: 10 })];
    render(
      <MuestrasListPanel muestras={muestras} onRemoveSample={onRemoveSample} etapas={etapas} />
    );
    expect(screen.getByText('Entrada')).toBeInTheDocument();
  });

  it('shows weight formatted with toFixed(3) and "kg"', () => {
    const muestras = [makeMuestra({ pesoNeto: 12.5 })];
    render(<MuestrasListPanel muestras={muestras} onRemoveSample={onRemoveSample} />);
    expect(screen.getByText('12.500 kg')).toBeInTheDocument();
  });

  it('shows estadoValidacion badge text', () => {
    const muestras = [makeMuestra({ estadoValidacion: 'fuera_de_rango' })];
    render(<MuestrasListPanel muestras={muestras} onRemoveSample={onRemoveSample} />);
    expect(screen.getByText('fuera_de_rango')).toBeInTheDocument();
  });

  // ── Styling by estadoValidacion ───────────────────────────────────────────────

  it('applies green styling to badge when estadoValidacion is "ok"', () => {
    const muestras = [makeMuestra({ estadoValidacion: 'ok' })];
    render(<MuestrasListPanel muestras={muestras} onRemoveSample={onRemoveSample} />);
    const badge = screen.getByText('ok');
    expect(badge.className).toMatch(/green/);
  });

  it('applies red styling to badge when estadoValidacion is not "ok"', () => {
    const muestras = [makeMuestra({ estadoValidacion: 'fuera_de_rango' })];
    render(<MuestrasListPanel muestras={muestras} onRemoveSample={onRemoveSample} />);
    const badge = screen.getByText('fuera_de_rango');
    expect(badge.className).toMatch(/red/);
  });

  // ── Delete button ─────────────────────────────────────────────────────────────

  it('clicking delete button calls onRemoveSample with the row index', async () => {
    const user = userEvent.setup();
    onRemoveSample.mockResolvedValue(undefined);
    const muestras = [
      makeMuestra({ id: 10 }),
      makeMuestra({ id: 20 }),
      makeMuestra({ id: 30 }),
    ];
    render(<MuestrasListPanel muestras={muestras} onRemoveSample={onRemoveSample} />);

    const buttons = screen.getAllByRole('button', { name: /eliminar/i });
    // Click the second delete button → index 1
    await user.click(buttons[1]);
    expect(onRemoveSample).toHaveBeenCalledWith(1);
    expect(onRemoveSample).toHaveBeenCalledTimes(1);
  });
});
