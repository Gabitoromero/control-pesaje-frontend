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
  const onSampleClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Empty state ───────────────────────────────────────────────────────────────

  it('renders default empty message when muestras is empty', () => {
    render(<MuestrasListPanel muestras={[]} onSampleClick={onSampleClick} />);
    expect(screen.getByText('No hay muestras registradas en esta sesión.')).toBeInTheDocument();
  });

  it('renders custom emptyMessage when provided and muestras is empty', () => {
    render(
      <MuestrasListPanel
        muestras={[]}
        onSampleClick={onSampleClick}
        emptyMessage="Lista vacía"
      />
    );
    expect(screen.getByText('Lista vacía')).toBeInTheDocument();
    expect(screen.queryByText('No hay muestras registradas en esta sesión.')).not.toBeInTheDocument();
  });

  // ── Row rendering ─────────────────────────────────────────────────────────────

  it('renders one row per muestra', () => {
    const muestras = [makeMuestra({ id: 1 }), makeMuestra({ id: 2 }), makeMuestra({ id: 3 })];
    render(<MuestrasListPanel muestras={muestras} onSampleClick={onSampleClick} />);
    // No inline delete buttons anymore — rows are clickable instead
    expect(screen.queryAllByRole('button', { name: /eliminar/i })).toHaveLength(0);
    // Three rows rendered (one #1, #2, #3)
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('shows sequential numbers oldest-first: first item in array = #1', () => {
    const muestras = [
      makeMuestra({ id: 10 }),
      makeMuestra({ id: 20 }),
      makeMuestra({ id: 30 }),
    ];
    render(<MuestrasListPanel muestras={muestras} onSampleClick={onSampleClick} />);
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
      <MuestrasListPanel muestras={muestras} onSampleClick={onSampleClick} etapas={etapas} />
    );
    expect(screen.getByText('Entrada')).toBeInTheDocument();
  });

  it('shows weight formatted with toFixed(3) and "kg"', () => {
    const muestras = [makeMuestra({ pesoNeto: 12.5 })];
    render(<MuestrasListPanel muestras={muestras} onSampleClick={onSampleClick} />);
    expect(screen.getByText('12.500 kg')).toBeInTheDocument();
  });

  it('shows estadoValidacion badge text', () => {
    const muestras = [makeMuestra({ estadoValidacion: 'fuera_de_rango' })];
    render(<MuestrasListPanel muestras={muestras} onSampleClick={onSampleClick} />);
    expect(screen.getByText('fuera_de_rango')).toBeInTheDocument();
  });

  // ── Styling by estadoValidacion ───────────────────────────────────────────────

  it('applies success token styling to badge when estadoValidacion is "ok"', () => {
    const muestras = [makeMuestra({ estadoValidacion: 'ok' })];
    render(<MuestrasListPanel muestras={muestras} onSampleClick={onSampleClick} />);
    const badge = screen.getByText('ok');
    expect(badge.className).toMatch(/success/);
  });

  it('applies danger token styling to badge when estadoValidacion is not "ok"', () => {
    const muestras = [makeMuestra({ estadoValidacion: 'fuera_de_rango' })];
    render(<MuestrasListPanel muestras={muestras} onSampleClick={onSampleClick} />);
    const badge = screen.getByText('fuera_de_rango');
    expect(badge.className).toMatch(/danger/);
  });

  // ── Row click (replaces inline delete) ────────────────────────────────────────

  it('clicking a row calls onSampleClick with the row index', async () => {
    const user = userEvent.setup();
    const muestras = [
      makeMuestra({ id: 10 }),
      makeMuestra({ id: 20 }),
      makeMuestra({ id: 30 }),
    ];
    render(<MuestrasListPanel muestras={muestras} onSampleClick={onSampleClick} />);

    const rows = screen.getAllByRole('button');
    // Click the second row → index 1
    await user.click(rows[1]);
    expect(onSampleClick).toHaveBeenCalledWith(1);
    expect(onSampleClick).toHaveBeenCalledTimes(1);
  });

  it('does not render any inline delete button', () => {
    const muestras = [makeMuestra({ id: 1 }), makeMuestra({ id: 2 })];
    render(<MuestrasListPanel muestras={muestras} onSampleClick={onSampleClick} />);
    expect(screen.queryAllByRole('button', { name: /eliminar/i })).toHaveLength(0);
  });

  // ── Filtered-array index contract (Phase 4.2 — highest design risk) ──────────
  // The panel itself has no etapa awareness: it always reports the index INTO
  // THE ARRAY IT WAS GIVEN. Callers (e.g. MuestrasLibresPage) that pass an
  // etapa-filtered subset are responsible for translating that index back to
  // the original full-array index before calling update/removeSample. This
  // test locks the panel's half of that contract: given a filtered array
  // built from samples spanning 2+ etapas, clicking row N must report index N
  // relative to the FILTERED array, not the original one.
  it('reports the index relative to the given (already-filtered) array, not any original array', async () => {
    const user = userEvent.setup();
    const original = [
      makeMuestra({ id: 1, etapaId: 10, pesoNeto: 1 }),
      makeMuestra({ id: 2, etapaId: 20, pesoNeto: 2 }),
      makeMuestra({ id: 3, etapaId: 10, pesoNeto: 3 }),
      makeMuestra({ id: 4, etapaId: 20, pesoNeto: 4 }),
    ];
    // Caller filters to etapaId 20 → originalIndex 1 and 3 survive.
    const filtered = original.filter((m) => m.etapaId === 20);
    render(<MuestrasListPanel muestras={filtered} onSampleClick={onSampleClick} />);

    const rows = screen.getAllByRole('button');
    expect(rows).toHaveLength(2);

    // Clicking the second filtered row must report filtered-index 1 (id 4),
    // NOT its original-array index 3.
    await user.click(rows[1]);
    expect(onSampleClick).toHaveBeenCalledWith(1);
  });
});
