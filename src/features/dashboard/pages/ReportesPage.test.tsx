import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';
import { ReportesPage } from './ReportesPage';

describe('ReportesPage', () => {
  it('renders the report card with title and description', () => {
    renderWithProviders(<ReportesPage />);

    expect(screen.getByText('Reporte de Pasadas y Muestras')).toBeInTheDocument();
    expect(screen.getByText('Reporte de pasadas y muestras consolidado.')).toBeInTheDocument();
  });

  it('renders the download button', () => {
    renderWithProviders(<ReportesPage />);

    const button = screen.getByRole('button', { name: /descargar/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });
});
