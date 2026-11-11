import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MonitoreoEtapaCard } from './MonitoreoEtapaCard';
import type { DashboardEtapa } from '../../../api/dashboard';
import { getSectorColor, SECTOR_NEUTRAL_COLOR } from '../../../lib/sectores';

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

  it('fills every sample with its sector color, out-of-range ones included, and rings only the out-of-range ones in red', () => {
    const etapaSectores: DashboardEtapa = {
      ...mockEtapa,
      timeSeries: [
        { peso: 100, time: '2026-07-22T10:05:00.000Z', pasadaId: 1, estadoValidacion: 'ok', sector: 'OF' },
        { peso: 80, time: '2026-07-22T10:06:00.000Z', pasadaId: 1, estadoValidacion: 'fuera_de_rango', sector: 'DD' },
        { peso: 101, time: '2026-07-22T10:07:00.000Z', pasadaId: null, estadoValidacion: 'ok', sector: 'MC' },
        { peso: 102, time: '2026-07-22T10:08:00.000Z', pasadaId: 1, estadoValidacion: 'ok', sector: null },
      ],
    };

    const { container } = render(
      <MonitoreoEtapaCard
        etapa={etapaSectores}
        rutaAsignadaAt="2026-07-22T10:00:00.000Z"
        ahora="2026-07-22T10:20:00.000Z"
      />
    );

    const points = Array.from(container.querySelectorAll<HTMLElement>('.border-2'));
    expect(points).toHaveLength(4);

    expect(points[0]).toHaveStyle({ backgroundColor: getSectorColor('OF') });
    expect(points[1]).toHaveStyle({ backgroundColor: getSectorColor('DD') });
    expect(points[2]).toHaveStyle({ backgroundColor: getSectorColor('MC') });
    expect(points[3]).toHaveStyle({ backgroundColor: SECTOR_NEUTRAL_COLOR });

    // Red is no longer a fill color
    points.forEach((p) => expect(p.className).not.toContain('bg-destructive'));

    // Only the out-of-range sample carries the ring
    expect(points[1].dataset.fueraRango).toBe('true');
    expect(points[1].style.boxShadow).not.toBe('');
    expect(points[0].style.boxShadow).toBe('');
    expect(points[2].style.boxShadow).toBe('');
  });

  it('shows a legend with the sectors present in the chart, the red ring for out of range and no green/red dots', () => {
    const etapaLeyenda: DashboardEtapa = {
      ...mockEtapa,
      muestrasConformes: 2,
      muestrasFueraRango: 1,
      muestrasTotales: 3,
      timeSeries: [
        { peso: 100, time: '2026-07-22T10:05:00.000Z', pasadaId: 1, estadoValidacion: 'ok', sector: 'OF' },
        { peso: 80, time: '2026-07-22T10:06:00.000Z', pasadaId: 1, estadoValidacion: 'fuera_de_rango', sector: 'DD' },
        { peso: 102, time: '2026-07-22T10:08:00.000Z', pasadaId: 1, estadoValidacion: 'ok', sector: null },
      ],
    };

    render(
      <MonitoreoEtapaCard
        etapa={etapaLeyenda}
        rutaAsignadaAt="2026-07-22T10:00:00.000Z"
        ahora="2026-07-22T10:20:00.000Z"
      />
    );

    const leyenda = screen.getByTestId('monitoreo-leyenda');
    expect(leyenda).toHaveTextContent('Oficiales');
    expect(leyenda).toHaveTextContent('Control de Calidad');
    expect(leyenda).toHaveTextContent('Sin sector');
    expect(leyenda).not.toHaveTextContent('Supervisores');
    expect(leyenda).not.toHaveTextContent('Mejora Continua');

    const fuera = screen.getByTestId('leyenda-fuera-rango');
    expect(fuera).toHaveTextContent('1 fuera de rango');
    expect(within(fuera).getByTestId('leyenda-anillo').style.boxShadow).not.toBe('');
    expect(leyenda).toHaveTextContent('2 ok');

    // The old green/red dots no longer match the chart: fill is the sector, red is only the ring
    expect(leyenda.querySelector('.text-success')).toBeNull();
    expect(leyenda.querySelector('.text-destructive')).toBeNull();
  });

  it('displays the last weight with four decimal places', () => {
    const etapaPrecision: DashboardEtapa = {
      ...mockEtapa,
      ultimoPeso: 98.2451,
    };

    render(
      <MonitoreoEtapaCard
        etapa={etapaPrecision}
        rutaAsignadaAt="2026-07-22T10:00:00.000Z"
        ahora="2026-07-22T10:20:00.000Z"
      />
    );

    expect(screen.getByText('98.2451')).toBeInTheDocument();
  });

  it('uses last sample weight as fallback when ultimoPeso is 0', () => {
    const etapaSinUltimo: DashboardEtapa = {
      ...mockEtapa,
      ultimoPeso: 0,
      timeSeries: [
        { peso: 104.1283, time: '2026-07-22T10:05:00.000Z', pasadaId: 1, estadoValidacion: 'ok' }
      ]
    };

    render(
      <MonitoreoEtapaCard
        etapa={etapaSinUltimo}
        rutaAsignadaAt="2026-07-22T10:00:00.000Z"
        ahora="2026-07-22T10:20:00.000Z"
      />
    );

    expect(screen.getByText('104.1283')).toBeInTheDocument();
  });

  describe('magnitud', () => {
    const renderCard = (etapa: DashboardEtapa) =>
      render(
        <MonitoreoEtapaCard
          etapa={etapa}
          rutaAsignadaAt="2026-07-22T09:00:00.000Z"
          ahora="2026-07-22T10:00:00.000Z"
        />
      );

    it('a volumen etapa labels the range, the last value and the sample tooltip in mL', () => {
      const { container } = renderCard({ ...mockEtapa, magnitud: 'volumen' });

      expect(screen.getByText(/rango 90–110 mL · ideal 100 mL/)).toBeInTheDocument();
      expect(screen.getByText('ÚLTIMO VOLUMEN')).toBeInTheDocument();
      expect(screen.getByTestId('ultimo-peso')).toHaveTextContent(/^100\.0000 mL$/);
      expect(container.querySelector('[title^="101.0mL · OK"]')).toBeInTheDocument();
      expect(container.textContent).not.toMatch(/\d ?g\b/);
    });

    it('an etapa without magnitud keeps the g labels', () => {
      const { container } = renderCard(mockEtapa);

      expect(screen.getByText(/rango 90–110 g · ideal 100 g/)).toBeInTheDocument();
      expect(screen.getByText('ÚLTIMO PESO')).toBeInTheDocument();
      expect(screen.getByTestId('ultimo-peso')).toHaveTextContent(/^100\.0000 g$/);
      expect(container.querySelector('[title^="101.0g · OK"]')).toBeInTheDocument();
    });
  });
});
