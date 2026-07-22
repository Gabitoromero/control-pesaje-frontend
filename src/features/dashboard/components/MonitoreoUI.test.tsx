import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MonitoreoLineHeader } from './MonitoreoLineHeader';
import { MonitoreoKpiStrip } from './MonitoreoKpiStrip';

describe('MonitoreoUI Components', () => {
  describe('MonitoreoLineHeader', () => {
    it('renders with the new DashboardLineaResumen shape', () => {
      const resumen = {
        conectado: true,
        tiempoDesdeRuta: 3600000,
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

    it('uses the semantic primary token instead of raw cyan-400 for the línea name', () => {
      const resumen = { conectado: false, pasadaEnCurso: null };

      render(
        <MonitoreoLineHeader
          resumen={resumen as any}
          lineaNombre="Linea 1"
          rutaActivaNombre={null}
          isFullscreen={false}
          onLineaChange={() => {}}
          onFullscreen={() => {}}
        />
      );

      const lineaNombre = screen.getByText('Linea 1');
      expect(lineaNombre.className).toContain('text-primary');
      expect(lineaNombre.className).not.toContain('text-cyan-400');
    });

    it('shows a "sin dispositivo" badge when sinDispositivo is true', () => {
      const resumen = { conectado: false, pasadaEnCurso: null };

      render(
        <MonitoreoLineHeader
          resumen={resumen as any}
          lineaNombre="Linea 1"
          rutaActivaNombre="Alfajores Triples"
          isFullscreen={false}
          sinDispositivo
          onLineaChange={() => {}}
          onFullscreen={() => {}}
        />
      );

      expect(screen.getByText(/sin dispositivo/i)).toBeInTheDocument();
    });

    it('does not show the "sin dispositivo" badge when sinDispositivo is false or omitted', () => {
      const resumen = { conectado: false, pasadaEnCurso: null };

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

      expect(screen.queryByText(/sin dispositivo/i)).not.toBeInTheDocument();
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
