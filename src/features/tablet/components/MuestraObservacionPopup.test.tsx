import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MuestraObservacionPopup } from './MuestraObservacionPopup';
import type { Muestra } from '../../../shared/types/domain';

const makeMuestra = (overrides: Partial<Muestra> = {}): Muestra => ({
  id: 7,
  pesoNeto: 12.5,
  estadoValidacion: 'ok',
  usuarioId: 3,
  etapaId: 10,
  lineaProduccionId: 1,
  timestamp: '2026-07-01T10:00:00Z',
  observacion: 'original note',
  ...overrides,
});

describe('MuestraObservacionPopup', () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onDelete = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    onSave.mockResolvedValue(undefined);
    onDelete.mockResolvedValue(undefined);
  });

  // ── Display (spec: Popup Display) ──────────────────────────────────────────

  it('renders nothing when isOpen is false', () => {
    render(
      <MuestraObservacionPopup
        muestra={makeMuestra()}
        index={0}
        isOpen={false}
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    );
    expect(screen.queryByText(/muestra/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders sample number, weight (3 decimals), validation badge and textarea when open', () => {
    render(
      <MuestraObservacionPopup
        muestra={makeMuestra({ pesoNeto: 12.5, estadoValidacion: 'ok' })}
        index={2}
        isOpen
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    );
    // Sample number (index+1)
    expect(screen.getByText(/#3/)).toBeInTheDocument();
    // Weight formatted to 3 decimals
    expect(screen.getByText('12.500')).toBeInTheDocument();
    // Validation badge
    expect(screen.getByText('ok')).toBeInTheDocument();
    // Observation textarea pre-filled with existing observation
    expect(screen.getByRole('textbox')).toHaveValue('original note');
  });

  it('formats weight to exactly 3 decimal places', () => {
    render(
      <MuestraObservacionPopup
        muestra={makeMuestra({ pesoNeto: 5 })}
        index={0}
        isOpen
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    );
    expect(screen.getByText('5.000')).toBeInTheDocument();
  });

  it('shows fuera_de_rango validation badge when status is fuera_de_rango', () => {
    render(
      <MuestraObservacionPopup
        muestra={makeMuestra({ estadoValidacion: 'fuera_de_rango' })}
        index={0}
        isOpen
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    );
    expect(screen.getByText('fuera_de_rango')).toBeInTheDocument();
  });

  // ── Save (spec: Observation Editing) ────────────────────────────────────────

  it('calls onSave with index and edited observation text on Confirm', async () => {
    const user = userEvent.setup();
    render(
      <MuestraObservacionPopup
        muestra={makeMuestra({ observacion: 'original note' })}
        index={4}
        isOpen
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'nueva nota');

    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(onSave).toHaveBeenCalledWith(4, 'nueva nota');
  });

  it('calls onSave with empty string when textarea is cleared and Confirm clicked', async () => {
    const user = userEvent.setup();
    render(
      <MuestraObservacionPopup
        muestra={makeMuestra({ observacion: 'original note' })}
        index={1}
        isOpen
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);

    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(onSave).toHaveBeenCalledWith(1, '');
  });

  it('calls onClose without saving when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MuestraObservacionPopup
        muestra={makeMuestra({ observacion: 'original note' })}
        index={0}
        isOpen
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    );

    await user.type(screen.getByRole('textbox'), ' edited');
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  // ── Delete (spec: Delete Inside Popup) ──────────────────────────────────────

  it('calls onDelete with index when Delete is clicked and confirm is accepted', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MuestraObservacionPopup
        muestra={makeMuestra()}
        index={3}
        isOpen
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith(3);
  });

  it('does NOT call onDelete when confirm is dismissed and popup stays open', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <MuestraObservacionPopup
        muestra={makeMuestra()}
        index={3}
        isOpen
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
