import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MonitoreoLineHeader } from './MonitoreoLineHeader';
import { MonitoreoKpiStrip } from './MonitoreoKpiStrip';

describe('MonitoreoUI Components', () => {
  describe('MonitoreoLineHeader', () => {
    it('renders with the new DashboardLineaResumen shape', () => {
      const resumen = {
        conectado: true,
        pasadaEnCurso: {
          id: 1,
          horaInicio: new Date().toISOString(),
          estado: 'EN_CURSO',
          tiempoTranscurrido: 3600000,
          rutaPasada: { id: 1, nombre: 'Alfajores Triples' }
        }
      };

      render(
        <MonitoreoLineHeader
          resumen={resumen as any}
          lineaNombre="Linea 1"
          rutaActivaNombre="Alfajores Triples"
          isFullscreen={false}
          onLineaChange={() => {}}
          onFullscreen={() => {}}
        />
      );

      expect(screen.getByText('Linea 1')).toBeInTheDocument();
      expect(screen.getByText('Alfajores Triples')).toBeInTheDocument();
      expect(screen.getByText('01:00:00')).toBeInTheDocument();
    });
  });

  describe('MonitoreoKpiStrip', () => {
    it('renders with the new DashboardKpi shape', () => {
      const kpis = {
        muestrasTotales: 100,
        fueraRango: 5,
        pasadasFinalizadas: 10,
        pasadasEnCurso: 1
      };

      render(<MonitoreoKpiStrip kpis={kpis as any} />);

      expect(screen.getByText('100')).toBeInTheDocument(); // Muestras
      expect(screen.getByText('5')).toBeInTheDocument(); // Fuera de rango
    });
  });
});
