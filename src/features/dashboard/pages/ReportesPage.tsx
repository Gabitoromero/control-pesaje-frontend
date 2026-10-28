import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  downloadReporteMuestras,
  downloadReportePasadas,
  downloadReporteRutasPasada,
} from '@/api/reportes';

// Keep in sync with MAX_RANGE_DAYS in the backend reporte.controller.
const MAX_RANGE_DAYS = 90;
const DAY_MS = 1000 * 60 * 60 * 24;

type LoadingPhase = 'generando' | 'descargando';

interface ReporteBase {
  id: string;
  titulo: string;
  descripcion: string;
}

interface ReporteConRango extends ReporteBase {
  requiresDateRange: true;
  download: (desde: string, hasta: string, onResponseStart?: () => void) => Promise<void>;
}

interface ReporteDirecto extends ReporteBase {
  requiresDateRange: false;
  download: () => Promise<void>;
}

type ReporteDefinicion = ReporteConRango | ReporteDirecto;

const REPORTES: ReporteDefinicion[] = [
  {
    id: 'reporte-muestras',
    titulo: 'Reporte de Muestras',
    descripcion:
      'Todas las muestras del rango en una única hoja, con línea, balanza, código y artículo.',
    requiresDateRange: true,
    download: downloadReporteMuestras,
  },
  {
    id: 'reporte-pasadas',
    titulo: 'Reporte de Pasadas',
    descripcion: 'Pasadas del rango con una hoja por línea de producción y su hoja de etapas.',
    requiresDateRange: true,
    download: downloadReportePasadas,
  },
  {
    id: 'reporte-rutas-pasada',
    titulo: 'Reporte de Rutas de Pasada',
    descripcion:
      'Configuración actual de rutas de pasada, sus etapas con pesos y los artículos asignados.',
    requiresDateRange: false,
    download: downloadReporteRutasPasada,
  },
];

export const ReportesPage: React.FC = () => {
  const [modalReporte, setModalReporte] = useState<ReporteConRango | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<LoadingPhase>('generando');

  // Validation
  const validateDates = () => {
    if (!desde || !hasta) return 'Ambas fechas son obligatorias.';
    const dDesde = new Date(desde);
    const dHasta = new Date(hasta);
    if (isNaN(dDesde.getTime()) || isNaN(dHasta.getTime())) {
        return 'Fechas inválidas.';
    }
    if (dHasta < dDesde) {
        return 'La fecha "Hasta" debe ser mayor o igual a "Desde".';
    }
    // Both days are included in the range (same criterion as the backend).
    const rangeDays = Math.round((dHasta.getTime() - dDesde.getTime()) / DAY_MS) + 1;
    if (rangeDays > MAX_RANGE_DAYS) {
      return `El rango de fechas no puede ser mayor a ${MAX_RANGE_DAYS} días.`;
    }
    return null;
  };

  const validationError = validateDates();

  const handleDownload = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (validationError || !modalReporte) return;

    try {
      setPhase('generando');
      setLoading(true);
      await modalReporte.download(desde, hasta, () => setPhase('descargando'));
      setModalReporte(null);
    } catch (error) {
      console.error('Error al descargar el reporte', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDownload = async (reporte: ReporteDirecto) => {
    try {
      setDownloadingId(reporte.id);
      await reporte.download();
    } catch (error) {
      console.error('Error al descargar el reporte', error);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Reportes</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {REPORTES.map((reporte) => {
          const isDownloading = downloadingId === reporte.id;
          return (
            <div
              key={reporte.id}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-3"
            >
              <h3 className="text-lg font-bold text-foreground">{reporte.titulo}</h3>
              <p className="text-sm text-muted-foreground flex-1">{reporte.descripcion}</p>

              <div>
                <button
                  type="button"
                  aria-label={`Descargar ${reporte.titulo}`}
                  disabled={isDownloading}
                  onClick={() =>
                    reporte.requiresDateRange ? setModalReporte(reporte) : handleDirectDownload(reporte)
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {isDownloading ? 'Descargando...' : 'Descargar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <Dialog
        open={modalReporte !== null}
        onOpenChange={(open) => { if (!open && !loading) setModalReporte(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descargar Reporte</DialogTitle>
          </DialogHeader>
          {modalReporte && <p className="text-sm text-muted-foreground">{modalReporte.titulo}</p>}
          <form onSubmit={handleDownload} className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="desde" className="text-sm font-medium">Desde</label>
              <input
                id="desde"
                type="date"
                value={desde}
                disabled={loading}
                onChange={(e) => setDesde(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="hasta" className="text-sm font-medium">Hasta</label>
              <input
                id="hasta"
                type="date"
                value={hasta}
                disabled={loading}
                onChange={(e) => setHasta(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {validationError && (desde || hasta) && (
              <p className="text-sm text-red-500">{validationError}</p>
            )}

            {loading && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4"
              >
                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden="true" />
                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-foreground">
                    {phase === 'generando'
                      ? 'Generando el reporte en el servidor...'
                      : 'Reporte listo, descargando el archivo...'}
                  </span>
                  <span className="text-muted-foreground">
                    {phase === 'generando'
                      ? 'El servidor recibió la solicitud y está procesando los datos. Con rangos largos puede demorar varios minutos; no cierres esta ventana.'
                      : 'La descarga comenzará en unos instantes.'}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!!validationError || loading}
              className="mt-4 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Descargando...' : 'Descargar'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
