import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MonitoreoLineHeader } from '../components/MonitoreoLineHeader';
import { MonitoreoKpiStrip } from '../components/MonitoreoKpiStrip';
import { MonitoreoEtapasCarousel } from '../components/MonitoreoEtapasCarousel';
import { useMonitoreoLineas } from '../hooks/useMonitoreoLineas';
import { EmptyState } from '../../../components/EmptyState';
import { Loader2, Inbox } from 'lucide-react';

export const MonitoreoFullscreenPage = () => {
  const navigate = useNavigate();
  const {
    lineas,
    lineaActual,
    resumen,
    kpis,
    etapas,
    isEmpty,
    isLoading,
    lineaIndex,
    onLineaChange,
  } = useMonitoreoLineas();

  const handleExitFullscreen = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  if (isEmpty) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <EmptyState
          icon={Inbox}
          title="Sin líneas activas"
          subtitle="Ninguna línea tiene una ruta asignada en este momento."
        />
      </div>
    );
  }

  if (isLoading) {
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
    <div className="fixed inset-0 bg-background z-50 p-4 md:p-6 overflow-hidden flex flex-col gap-3">
      {/* 60s Global Progress Bar */}
      {lineas.length > 1 && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-accent/30 overflow-hidden z-50">
          <div key={lineaActual?.id} className="h-full bg-primary origin-left" style={{ animation: 'progress-fill 60s linear forwards' }} />
        </div>
      )}

      {/* Top section: header + KPIs */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        <MonitoreoLineHeader
          resumen={resumen}
          lineaNombre={lineaActual?.nombre ?? 'Desconocida'}
          rutaActivaNombre={lineaActual?.rutaPasadaActiva?.nombre ?? null}
          sinDispositivo={!lineaActual?.dispositivo}
          onLineaChange={onLineaChange}
          onFullscreen={handleExitFullscreen}
          isFullscreen={true}
        />
        {kpis && <MonitoreoKpiStrip kpis={kpis} />}
      </div>

      {/* Bottom 70%: chart */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={lineaIndex}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.03, y: -10 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="flex-1 min-h-0 h-full flex flex-col"
          >
            <MonitoreoEtapasCarousel etapas={etapas} rutaAsignadaAt={lineaActual?.rutaAsignadaAt ?? null} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
