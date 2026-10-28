import { screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderWithProviders } from '../../../test/render';
import { ReportesPage } from './ReportesPage';
import {
  downloadReporteMuestras,
  downloadReportePasadas,
  downloadReporteRutasPasada,
} from '@/api/reportes';

vi.mock('@/api/reportes', () => ({
  downloadReporteMuestras: vi.fn(),
  downloadReportePasadas: vi.fn(),
  downloadReporteRutasPasada: vi.fn(),
}));

const muestrasButton = () => screen.getByRole('button', { name: /descargar reporte de muestras/i });
const pasadasButton = () => screen.getByRole('button', { name: /descargar reporte de pasadas/i });
const rutasButton = () =>
  screen.getByRole('button', { name: /descargar reporte de rutas de pasada/i });

async function fillRange(user: ReturnType<typeof userEvent.setup>, desde: string, hasta: string) {
  await user.type(screen.getByLabelText('Desde'), desde);
  await user.type(screen.getByLabelText('Hasta'), hasta);
}

const submitButton = () =>
  within(screen.getByRole('dialog')).getByText(/^descargar(ando\.\.\.)?$/i, { selector: 'button[type="submit"]' });

describe('ReportesPage', () => {
  beforeEach(() => {
    vi.mocked(downloadReporteMuestras).mockReset().mockResolvedValue(undefined);
    vi.mocked(downloadReportePasadas).mockReset().mockResolvedValue(undefined);
    vi.mocked(downloadReporteRutasPasada).mockReset().mockResolvedValue(undefined);
  });

  it('renders the three report cards with title and description', () => {
    renderWithProviders(<ReportesPage />);

    expect(screen.getByText('Reporte de Muestras')).toBeInTheDocument();
    expect(screen.getByText('Reporte de Pasadas')).toBeInTheDocument();
    expect(screen.getByText('Reporte de Rutas de Pasada')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Configuración actual de rutas de pasada, sus etapas con pesos y los artículos asignados.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Reporte de Pasadas y Muestras')).toBeNull();
  });

  it('renders one enabled download button per report', () => {
    renderWithProviders(<ReportesPage />);

    expect(muestrasButton()).not.toBeDisabled();
    expect(pasadasButton()).not.toBeDisabled();
    expect(rutasButton()).not.toBeDisabled();
    expect(screen.getAllByRole('button', { name: /^descargar/i })).toHaveLength(3);
  });

  it('downloads the rutas report directly without opening the date dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportesPage />);

    await user.click(rutasButton());

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(downloadReporteRutasPasada).toHaveBeenCalledTimes(1);
    expect(downloadReporteRutasPasada).toHaveBeenCalledWith();
    expect(downloadReporteMuestras).not.toHaveBeenCalled();
    expect(downloadReportePasadas).not.toHaveBeenCalled();
  });

  it('shows "Descargando..." and disables the button while the rutas download is pending', async () => {
    let resolve!: () => void;
    vi.mocked(downloadReporteRutasPasada).mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ReportesPage />);

    await user.click(rutasButton());

    const pending = await screen.findByRole('button', { name: /descargar reporte de rutas de pasada/i });
    expect(pending).toBeDisabled();
    expect(pending).toHaveTextContent('Descargando...');

    resolve();
    await waitFor(() => expect(rutasButton()).not.toBeDisabled());
    expect(rutasButton()).toHaveTextContent('Descargar');
    expect(rutasButton()).not.toHaveTextContent('Descargando...');
  });

  it('logs the error and re-enables the button when the rutas download fails', async () => {
    const error = new Error('boom');
    vi.mocked(downloadReporteRutasPasada).mockRejectedValue(error);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithProviders(<ReportesPage />);

    await user.click(rutasButton());

    await waitFor(() => expect(spy).toHaveBeenCalledWith(expect.any(String), error));
    await waitFor(() => expect(rutasButton()).not.toBeDisabled());
    expect(rutasButton()).not.toHaveTextContent('Descargando...');
    spy.mockRestore();
  });

  it.each([
    ['muestras', muestrasButton, downloadReporteMuestras, downloadReportePasadas],
    ['pasadas', pasadasButton, downloadReportePasadas, downloadReporteMuestras],
  ] as const)(
    'submits valid dates to the %s download only and closes the dialog',
    async (_name, button, expected, other) => {
      const user = userEvent.setup();
      renderWithProviders(<ReportesPage />);

      await user.click(button());
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(expected).not.toHaveBeenCalled();
      await fillRange(user, '2026-10-01', '2026-10-03');
      await user.click(submitButton());

      await waitFor(() =>
        expect(expected).toHaveBeenCalledWith('2026-10-01', '2026-10-03', expect.any(Function)),
      );
      expect(expected).toHaveBeenCalledTimes(1);
      expect(other).not.toHaveBeenCalled();
      expect(downloadReporteRutasPasada).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    },
  );

  it('accepts a range of exactly 90 days', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportesPage />);

    await user.click(pasadasButton());
    await fillRange(user, '2026-01-01', '2026-03-31');

    expect(screen.queryByText(/no puede ser mayor a/)).toBeNull();
    expect(submitButton()).not.toBeDisabled();
  });

  it('rejects a range of 91 days and blocks submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportesPage />);

    await user.click(pasadasButton());
    await fillRange(user, '2026-01-01', '2026-04-01');

    expect(screen.getByText('El rango de fechas no puede ser mayor a 90 días.')).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
    expect(downloadReportePasadas).not.toHaveBeenCalled();
  });

  it('keeps the "Hasta" before "Desde" validation (regression)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportesPage />);

    await user.click(muestrasButton());
    await fillRange(user, '2026-10-10', '2026-10-01');

    expect(
      screen.getByText('La fecha "Hasta" debe ser mayor o igual a "Desde".'),
    ).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it('shows a loading status through generation and download, then closes the dialog', async () => {
    let finish!: () => void;
    let onResponseStart: (() => void) | undefined;
    vi.mocked(downloadReportePasadas).mockImplementation((_d, _h, cb) => {
      onResponseStart = cb;
      return new Promise<void>((r) => {
        finish = r;
      });
    });
    const user = userEvent.setup();
    renderWithProviders(<ReportesPage />);

    await user.click(pasadasButton());
    await fillRange(user, '2026-10-01', '2026-10-03');
    expect(screen.queryByRole('status')).toBeNull();
    await user.click(submitButton());

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Generando el reporte en el servidor...');
    const loadingButton = within(screen.getByRole('dialog')).getByRole('button', { name: 'Descargando...' });
    expect(loadingButton).toBeDisabled();
    expect(screen.getByLabelText('Desde')).toBeDisabled();
    expect(screen.getByLabelText('Hasta')).toBeDisabled();

    act(() => onResponseStart?.());
    expect(await screen.findByRole('status')).toHaveTextContent('Reporte listo, descargando el archivo...');

    await act(async () => finish());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('does not let the dialog be dismissed with Escape while the file is loading', async () => {
    vi.mocked(downloadReporteMuestras).mockReturnValue(new Promise<void>(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<ReportesPage />);

    await user.click(muestrasButton());
    await fillRange(user, '2026-10-01', '2026-10-03');
    await user.click(submitButton());
    await screen.findByRole('status');

    await user.keyboard('{Escape}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('keeps the dialog open, logs the error and clears the loading state when the download fails', async () => {
    const error = new Error('boom');
    vi.mocked(downloadReporteMuestras).mockRejectedValue(error);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithProviders(<ReportesPage />);

    await user.click(muestrasButton());
    await fillRange(user, '2026-10-01', '2026-10-03');
    await user.click(submitButton());

    await waitFor(() => expect(spy).toHaveBeenCalledWith(expect.any(String), error));
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(submitButton()).not.toBeDisabled();
    spy.mockRestore();
  });
});
