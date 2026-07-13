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
import { Loader2 } from 'lucide-react';

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
    <div className="fixed inset-0 bg-background z-50 grid grid-rows-[auto_auto_1fr] gap-3 p-4 md:p-6 overflow-hidden">
      <MonitoreoLineHeader
        resumen={resumen}
        onLineaChange={handleLineaChange}
        onFullscreen={handleExitFullscreen}
        isFullscreen={true}
      />

      {kpis && (
        <div className="min-h-0">
          <MonitoreoKpiStrip kpis={kpis} />
        </div>
      )}

      <div className="min-h-0">
        <MonitoreoEtapasCarousel etapas={etapas} />
      </div>
    </div>
  );
};
