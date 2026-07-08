import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';
import { ReportesPage } from './ReportesPage';

describe('ReportesPage', () => {
  it('renders both report cards with title and description', () => {
    renderWithProviders(<ReportesPage />);

    expect(screen.getByText('Listado de Pasadas por Ruta')).toBeInTheDocument();
    expect(screen.getByText('Listado de pasadas por ruta.')).toBeInTheDocument();

    expect(screen.getByText('Muestras por Ruta y Fecha')).toBeInTheDocument();
    expect(screen.getByText('Historial de muestras por ruta y fecha.')).toBeInTheDocument();
  });

  it('renders both download buttons as disabled (backend not implemented yet)', () => {
    renderWithProviders(<ReportesPage />);

    const buttons = screen.getAllByRole('button', { name: /descargar \.xlsx/i });
    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => expect(button).toBeDisabled());
  });

  it('shows a "Disponible próximamente" hint for each report', () => {
    renderWithProviders(<ReportesPage />);

    expect(screen.getAllByText('Disponible próximamente')).toHaveLength(2);
  });
});
