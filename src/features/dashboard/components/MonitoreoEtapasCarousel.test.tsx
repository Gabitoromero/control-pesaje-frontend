import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MonitoreoEtapasCarousel } from './MonitoreoEtapasCarousel';
import type { DashboardEtapa } from '../../../api/dashboard';

function makeEtapa(id: number, nombre: string): DashboardEtapa {
  return {
    etapa: { id, nombre },
    pesoIdeal: 100,
    pesoMinimo: 90,
    pesoMaximo: 110,
    ultimoPeso: 100,
    porcentajeConforme: 100,
    timeSeries: [],
  };
}

describe('MonitoreoEtapasCarousel', () => {
  it('renders the stage indicator labels using etapa.nombre (not etapaNombre)', () => {
    const etapas = [makeEtapa(1, 'Etapa Uno'), makeEtapa(2, 'Etapa Dos')];

    render(<MonitoreoEtapasCarousel etapas={etapas} />);

    expect(screen.getAllByText('Etapa Uno').length).toBeGreaterThan(0);
    expect(screen.getByText('Etapa Dos')).toBeInTheDocument();
  });
});
