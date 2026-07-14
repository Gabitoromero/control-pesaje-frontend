import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MonitoreoEtapaCard } from './MonitoreoEtapaCard';
import type { DashboardEtapa } from '../../../api/dashboard';

const etapa: DashboardEtapa = {
  etapa: { id: 1, nombre: 'Etapa Uno' },
  pesoIdeal: 100,
  pesoMinimo: 90,
  pesoMaximo: 110,
  ultimoPeso: 100,
  porcentajeConforme: 100,
  timeSeries: [],
};

describe('MonitoreoEtapaCard', () => {
  it('uses semantic warning/primary tokens instead of raw amber/cyan tailwind colors', () => {
    const { container } = render(<MonitoreoEtapaCard etapa={etapa} />);

    expect(container.querySelector('.bg-amber-500\\/60')).not.toBeInTheDocument();
    expect(container.querySelector('.text-amber-500')).not.toBeInTheDocument();
    expect(container.querySelector('.bg-cyan-400')).not.toBeInTheDocument();
    expect(container.querySelector('.text-cyan-400')).not.toBeInTheDocument();

    expect(container.querySelector('.bg-warning\\/60')).toBeInTheDocument();
    expect(container.querySelector('.text-warning')).toBeInTheDocument();
    expect(container.querySelector('.bg-primary')).toBeInTheDocument();
    expect(container.querySelector('.text-primary')).toBeInTheDocument();
  });
});
