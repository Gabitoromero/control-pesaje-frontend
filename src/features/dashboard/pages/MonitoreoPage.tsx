import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
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

export const MonitoreoPage = () => {
  const navigate = useNavigate();
  const [lineaIndex, setLineaIndex] = useState(0);

  const { data: lineas = [] } = useQuery({
    queryKey: ['dashboard-lineas'],
    queryFn: getDashboardLineas,
    refetchInterval: 30000,
  });

  const lineaId = lineas[lineaIndex]?.id ?? 1;

  useEffect(() => {
    if (lineas.length <= 1) return;
    const interval = setInterval(() => {
      setLineaIndex((prev) => (prev + 1 >= lineas.length ? 0 : prev + 1));
    }, 60000);
    return () => clearInterval(interval);
  }, [lineas.length, lineaIndex]);

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

  const handleFullscreen = useCallback(() => {
    navigate('/dashboard/monitoreo/fullscreen');
  }, [navigate]);

  if (loadingResumen) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!resumen) {
    return <div className="text-muted-foreground p-6">No hay datos disponibles para esta línea.</div>;
  }

  return (
    <div className="absolute inset-0 p-4 md:p-8 flex flex-col gap-3 bg-background">
      {/* 60s Global Progress Bar */}
      {lineas.length > 1 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-accent/30 overflow-hidden z-50">
          <div key={lineaId} className="h-full bg-cyan-400 origin-left" style={{ animation: 'progress-fill 60s linear forwards' }} />
        </div>
      )}

      {/* Top section: header + KPIs */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        <MonitoreoLineHeader
          resumen={resumen}
          lineaNombre={lineas[lineaIndex]?.nombre ?? 'Desconocida'}
          rutaActivaNombre={lineas[lineaIndex]?.rutaPasadaActiva?.nombre ?? null}
          onLineaChange={handleLineaChange}
          onFullscreen={handleFullscreen}
          isFullscreen={false}
        />
        {kpis && <MonitoreoKpiStrip kpis={kpis} />}
      </div>

      {/* Bottom 70%: chart */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={lineaId}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.03, y: -10 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="flex-1 min-h-0 h-full flex flex-col"
          >
            <MonitoreoEtapasCarousel etapas={etapas} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
