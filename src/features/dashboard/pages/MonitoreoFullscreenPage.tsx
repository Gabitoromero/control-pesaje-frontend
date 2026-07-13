import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getDashboardLineas,
  getDashboardResumen,
  getDashboardKpis,
  getDashboardEtapas,
} from '../../../api/dashboard';
import { MonitoreoLineHeader } from '../components/MonitoreoLineHeader';
import { MonitoreoKpiStrip } from '../components/MonitoreoKpiStrip';
import { MonitoreoEtapasCarousel } from '../components/MonitoreoEtapasCarousel';
import { Loader2, Minimize2 } from 'lucide-react';

export const MonitoreoFullscreenPage = () => {
  const navigate = useNavigate();
  const [lineaIndex, setLineaIndex] = useState(0);

  const { data: lineas = [] } = useQuery({
    queryKey: ['dashboard-lineas'],
    queryFn: getDashboardLineas,
    refetchInterval: 30000,
  });

  const lineaId = lineas[lineaIndex]?.id ?? 1;

  const { data: resumen, isLoading: loadingResumen } = useQuery({
    queryKey: ['dashboard-resumen', lineaId],
    queryFn: () => getDashboardResumen(lineaId),
    refetchInterval: 5000,
    enabled: lineas.length > 0,
  });

  const { data: kpis } = useQuery({
    queryKey: ['dashboard-kpis', lineaId],
    queryFn: () => getDashboardKpis(lineaId),
    refetchInterval: 10000,
    enabled: lineas.length > 0,
  });

  const { data: etapas = [] } = useQuery({
    queryKey: ['dashboard-etapas', lineaId],
    queryFn: () => getDashboardEtapas(lineaId),
    refetchInterval: 5000,
    enabled: lineas.length > 0,
  });

  const handleLineaChange = useCallback((delta: 1 | -1) => {
    setLineaIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return lineas.length - 1;
      if (next >= lineas.length) return 0;
      return next;
    });
  }, [lineas.length]);

  const handleExitFullscreen = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  if (loadingResumen) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!resumen) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center text-muted-foreground z-50">
        No hay datos disponibles para esta línea.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 p-6 flex flex-col gap-5 overflow-y-auto">
      {/* Top bar with exit button */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Monitoreo en Vivo</h1>
        <button
          onClick={handleExitFullscreen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-muted-foreground text-sm"
        >
          <Minimize2 size={16} />
          Salir de pantalla completa
        </button>
      </div>

      <MonitoreoLineHeader
        resumen={resumen}
        onLineaChange={handleLineaChange}
        onFullscreen={() => {}}
      />

      {kpis && <MonitoreoKpiStrip kpis={kpis} />}

      <div className="flex-1 min-h-0">
        <MonitoreoEtapasCarousel etapas={etapas} />
      </div>
    </div>
  );
};
