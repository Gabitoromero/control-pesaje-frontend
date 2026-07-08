import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MuestraObservacionPopup } from './MuestraObservacionPopup';
import type { Muestra } from '../../../shared/types/domain';
import { renderWithProviders } from '../../../test/render';

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
    renderWithProviders(
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
    renderWithProviders(
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
    renderWithProviders(
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
    renderWithProviders(
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
    renderWithProviders(
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
    renderWithProviders(
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
    renderWithProviders(
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

  it('calls onDelete with index when Delete is clicked and the confirm dialog is accepted', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm');

    renderWithProviders(
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

    const dialog = await screen.findByRole('alertdialog');
    expect(confirmSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: /eliminar/i }));

    expect(onDelete).toHaveBeenCalledWith(3);
  });

  it('does NOT call onDelete when the confirm dialog is cancelled and popup stays open', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm');

    renderWithProviders(
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

    const dialog = await screen.findByRole('alertdialog');
    expect(confirmSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: /cancelar/i }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  // ── Layout regression: footer must never be pushed off-screen ──────────────
  // jsdom cannot measure real viewport pixels/positions, so these assert the
  // STRUCTURE that guarantees the footer stays visible regardless of content
  // height: a capped outer card, a scrollable middle region wrapping only the
  // variable-height content, and the footer living OUTSIDE that scrollable
  // region as a flex sibling (never pushed off-screen no matter how tall the
  // content grows).

  it('caps the outer card height so it cannot exceed the viewport', () => {
    renderWithProviders(
      <MuestraObservacionPopup
        muestra={makeMuestra()}
        index={0}
        isOpen
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    );

    const dialog = screen.getByRole('dialog');
    const card = dialog.firstElementChild as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.className).toMatch(/max-h-\[90vh\]/);
    expect(card.className).toMatch(/flex-col/);
    expect(card.className).toMatch(/min-h-0/);
  });

  it('wraps the variable-height content (info + textarea) in a scrollable region', () => {
    renderWithProviders(
      <MuestraObservacionPopup
        muestra={makeMuestra()}
        index={0}
        isOpen
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    const scrollRegion = textarea.closest(
      '.overflow-y-auto'
    ) as HTMLElement | null;

    expect(scrollRegion).not.toBeNull();
    expect(scrollRegion!.className).toMatch(/flex-1/);
    expect(scrollRegion!.className).toMatch(/min-h-0/);
    // The textarea and read-only info both live inside the scroll region.
    expect(scrollRegion!.contains(textarea)).toBe(true);
  });

  it('keeps the Cancelar/Confirmar footer OUTSIDE the scrollable region, as a sibling', () => {
    renderWithProviders(
      <MuestraObservacionPopup
        muestra={makeMuestra()}
        index={0}
        isOpen
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    );

    const textarea = screen.getByRole('textbox');
    const scrollRegion = textarea.closest(
      '.overflow-y-auto'
    ) as HTMLElement | null;
    expect(scrollRegion).not.toBeNull();

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    const confirmButton = screen.getByRole('button', { name: /confirmar/i });

    // The core proof: no matter how tall the content grows, the footer is not
    // a descendant of the scrollable wrapper, so it can never be scrolled/
    // pushed out of view — it stays a visible sibling at the bottom.
    expect(scrollRegion!.contains(cancelButton)).toBe(false);
    expect(scrollRegion!.contains(confirmButton)).toBe(false);
  });
});
