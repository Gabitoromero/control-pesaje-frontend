import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';
import { ReportesPage } from './ReportesPage';

describe('ReportesPage', () => {
  it('renders both report cards with title and description', () => {
    renderWithProviders(<ReportesPage />);

    expect(screen.getByText('Rendimiento Físico')).toBeInTheDocument();
    expect(
      screen.getByText('Precisión de pesajes y desperdicio de materia prima por receta y etapa.')
    ).toBeInTheDocument();

    expect(screen.getByText('Trazabilidad Comercial')).toBeInTheDocument();
    expect(
      screen.getByText('Historial de lotes por artículo y marca para auditorías alimentarias.')
    ).toBeInTheDocument();
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
