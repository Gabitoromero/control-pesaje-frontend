import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ToleranceDisplay } from './ToleranceDisplay';

describe('ToleranceDisplay', () => {
  it('shows the OK badge when pesoNeto is within tolerance', () => {
    render(
      <ToleranceDisplay pesoNeto={15} pesoMinimo={10} pesoIdeal={15} pesoMaximo={20} />
    );

    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('10.000 kg')).toBeInTheDocument();
    expect(screen.getByText('15.000 kg')).toBeInTheDocument();
    expect(screen.getByText('20.000 kg')).toBeInTheDocument();
  });

  it('shows the "Fuera de Rango" badge when pesoNeto is outside tolerance', () => {
    render(
      <ToleranceDisplay pesoNeto={5} pesoMinimo={10} pesoIdeal={15} pesoMaximo={20} />
    );

    expect(screen.getByText('Fuera de Rango')).toBeInTheDocument();
  });

  it('does not render the badge when pesoNeto is 0 (no reading yet)', () => {
    render(
      <ToleranceDisplay pesoNeto={0} pesoMinimo={10} pesoIdeal={15} pesoMaximo={20} />
    );

    expect(screen.queryByText('OK')).not.toBeInTheDocument();
    expect(screen.queryByText('Fuera de Rango')).not.toBeInTheDocument();
  });

  it('uses primary accent classes by default', () => {
    const { container } = render(
      <ToleranceDisplay pesoNeto={15} pesoMinimo={10} pesoIdeal={15} pesoMaximo={20} />
    );

    expect(container.querySelector('.bg-primary\\/20')).not.toBeNull();
    expect(container.querySelector('.bg-primary')).not.toBeNull();
    expect(container.querySelector('.bg-warning\\/20')).toBeNull();
  });

  it('uses warning accent classes when variant="warning"', () => {
    const { container } = render(
      <ToleranceDisplay
        pesoNeto={15}
        pesoMinimo={10}
        pesoIdeal={15}
        pesoMaximo={20}
        variant="warning"
      />
    );

    expect(container.querySelector('.bg-warning\\/20')).not.toBeNull();
    expect(container.querySelector('.bg-primary\\/20')).toBeNull();
  });

  it('renders the 3-card MINIMO / IDEAL / MAXIMO grid', () => {
    render(
      <ToleranceDisplay pesoNeto={15} pesoMinimo={10} pesoIdeal={15} pesoMaximo={20} />
    );

    expect(screen.getByText('MINIMO')).toBeInTheDocument();
    expect(screen.getByText('IDEAL')).toBeInTheDocument();
    expect(screen.getByText('MAXIMO')).toBeInTheDocument();
  });
});
