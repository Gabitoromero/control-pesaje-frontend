import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderWithProviders } from '../../../test/render';
import { ReportesPage } from './ReportesPage';
import { downloadReportePasadasMuestras, downloadReporteRutasPasada } from '@/api/reportes';

vi.mock('@/api/reportes', () => ({
  downloadReportePasadasMuestras: vi.fn(),
  downloadReporteRutasPasada: vi.fn(),
}));

const pasadasButton = () =>
  screen.getByRole('button', { name: /descargar reporte de pasadas y muestras/i });
const rutasButton = () =>
  screen.getByRole('button', { name: /descargar reporte de rutas de pasada/i });

describe('ReportesPage', () => {
  beforeEach(() => {
    vi.mocked(downloadReportePasadasMuestras).mockReset().mockResolvedValue(undefined);
    vi.mocked(downloadReporteRutasPasada).mockReset().mockResolvedValue(undefined);
  });

  it('renders both report cards with title and description', () => {
    renderWithProviders(<ReportesPage />);

    expect(screen.getByText('Reporte de Pasadas y Muestras')).toBeInTheDocument();
    expect(screen.getByText('Reporte de pasadas y muestras consolidado.')).toBeInTheDocument();
    expect(screen.getByText('Reporte de Rutas de Pasada')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Configuración actual de rutas de pasada, sus etapas con pesos y los artículos asignados.',
      ),
    ).toBeInTheDocument();
  });

  it('renders one enabled download button per report', () => {
    renderWithProviders(<ReportesPage />);

    expect(pasadasButton()).not.toBeDisabled();
    expect(rutasButton()).not.toBeDisabled();
    expect(screen.getAllByRole('button', { name: /^descargar/i })).toHaveLength(2);
  });

  it('downloads the rutas report directly without opening the date dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportesPage />);

    await user.click(rutasButton());

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(downloadReporteRutasPasada).toHaveBeenCalledTimes(1);
    expect(downloadReporteRutasPasada).toHaveBeenCalledWith();
    expect(downloadReportePasadasMuestras).not.toHaveBeenCalled();
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

  it('opens the date dialog for the pasadas report without calling the rutas download', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportesPage />);

    await user.click(pasadasButton());

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(downloadReporteRutasPasada).not.toHaveBeenCalled();
    expect(downloadReportePasadasMuestras).not.toHaveBeenCalled();
  });

  it('submits valid dates to the pasadas download and closes the dialog (regression)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportesPage />);

    await user.click(pasadasButton());
    await user.type(screen.getByLabelText('Desde'), '2026-10-01');
    await user.type(screen.getByLabelText('Hasta'), '2026-10-03');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Descargar' }));

    await waitFor(() =>
      expect(downloadReportePasadasMuestras).toHaveBeenCalledWith('2026-10-01', '2026-10-03'),
    );
    expect(downloadReportePasadasMuestras).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(downloadReporteRutasPasada).not.toHaveBeenCalled();
  });

  it('keeps the >5 day validation and blocks submit (regression)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportesPage />);

    await user.click(pasadasButton());
    await user.type(screen.getByLabelText('Desde'), '2026-10-01');
    await user.type(screen.getByLabelText('Hasta'), '2026-10-10');

    expect(screen.getByText('El rango de fechas no puede ser mayor a 5 días.')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Descargar' })).toBeDisabled();
    expect(downloadReportePasadasMuestras).not.toHaveBeenCalled();
  });
});
