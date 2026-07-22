import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MonitoreoEtapaCard } from './MonitoreoEtapaCard';
import type { DashboardEtapa } from '../../../api/dashboard';

const mockEtapa: DashboardEtapa = {
  etapa: { id: 1, nombre: 'Amasado' },
  pesoIdeal: 100,
  pesoMinimo: 90,
  pesoMaximo: 110,
  ultimoPeso: 100,
  porcentajeConforme: 100,
  muestrasConformes: 1,
  muestrasFueraRango: 0,
  muestrasTotales: 1,
  timeSeries: [
    { peso: 101, time: '2026-07-22T10:00:00.000Z', pasadaId: 1, estadoValidacion: 'ok' },
  ],
};

describe('MonitoreoEtapaCard', () => {
  it('uses semantic warning/primary tokens instead of raw amber/cyan tailwind colors', () => {
    const { container } = render(
      <MonitoreoEtapaCard
        etapa={mockEtapa}
        rutaAsignadaAt="2026-07-22T09:00:00.000Z"
        ahora="2026-07-22T10:00:00.000Z"
      />
    );

    expect(container.querySelector('.bg-amber-500\\/60')).not.toBeInTheDocument();
    expect(container.querySelector('.text-amber-500')).not.toBeInTheDocument();
    expect(container.querySelector('.bg-cyan-400')).not.toBeInTheDocument();
    expect(container.querySelector('.text-cyan-400')).not.toBeInTheDocument();

    expect(container.querySelector('.bg-warning\\/60')).toBeInTheDocument();
    expect(container.querySelector('.text-warning')).toBeInTheDocument();
    expect(container.querySelector('.bg-primary')).toBeInTheDocument();
    expect(container.querySelector('.text-primary')).toBeInTheDocument();
  });

  it('renders free samples as diamonds (rotate-45, without rounded-full class) and pasada samples as circles (rounded-full)', () => {
    const etapaConLibres: DashboardEtapa = {
      ...mockEtapa,
      timeSeries: [
        { peso: 102, time: '2026-07-22T10:05:00.000Z', pasadaId: null, estadoValidacion: 'ok' }, // Libre
        { peso: 103, time: '2026-07-22T10:10:00.000Z', pasadaId: 42, estadoValidacion: 'ok' },   // Pasada
      ]
    };

    const { container } = render(
      <MonitoreoEtapaCard
        etapa={etapaConLibres}
        rutaAsignadaAt="2026-07-22T10:00:00.000Z"
        ahora="2026-07-22T10:20:00.000Z"
      />
    );

    // Points wrapper contains both points
    const points = container.querySelectorAll('.border-2');
    expect(points.length).toBe(2);

    // First is free (has rotate-45 and opacity, doesn't have rounded-full)
    expect(points[0].className).toContain('rotate-45');
    expect(points[0].className).not.toContain('rounded-full');

    // Second is normal (has rounded-full, doesn't have rotate-45)
    expect(points[1].className).toContain('rounded-full');
    expect(points[1].className).not.toContain('rotate-45');
  });

  it('displays the last weight with three decimal places', () => {
    const etapaPrecision: DashboardEtapa = {
      ...mockEtapa,
      ultimoPeso: 98.245,
    };

    render(
      <MonitoreoEtapaCard
        etapa={etapaPrecision}
        rutaAsignadaAt="2026-07-22T10:00:00.000Z"
        ahora="2026-07-22T10:20:00.000Z"
      />
    );

    expect(screen.getByText('98.245')).toBeInTheDocument();
  });

  it('uses last sample weight as fallback when ultimoPeso is 0', () => {
    const etapaSinUltimo: DashboardEtapa = {
      ...mockEtapa,
      ultimoPeso: 0,
      timeSeries: [
        { peso: 104.128, time: '2026-07-22T10:05:00.000Z', pasadaId: 1, estadoValidacion: 'ok' }
      ]
    };

    render(
      <MonitoreoEtapaCard
        etapa={etapaSinUltimo}
        rutaAsignadaAt="2026-07-22T10:00:00.000Z"
        ahora="2026-07-22T10:20:00.000Z"
      />
    );

    expect(screen.getByText('104.128')).toBeInTheDocument();
  });
});

