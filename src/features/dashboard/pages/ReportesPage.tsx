import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReporteDescargaProgreso, type ReporteDescargaFase } from '../components/ReporteDescargaProgreso';
import { ReporteIcon, type ReporteIconTipo } from '../components/ReporteIcons';
import {
  downloadReporteMuestras,
  downloadReportePasadas,
  downloadReporteRutasPasada,
} from '@/api/reportes';

// Keep in sync with MAX_RANGE_DAYS in the backend reporte.controller.
const MAX_RANGE_DAYS = 90;
const DAY_MS = 1000 * 60 * 60 * 24;


interface ReporteBase {
  id: string;
  titulo: string;
  descripcion: string;
  icono: ReporteIconTipo;
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
    icono: 'muestras',
    titulo: 'Reporte de Muestras',
    descripcion:
      'Todas las muestras del rango en una única hoja, con línea, balanza, código y artículo.',
    requiresDateRange: true,
    download: downloadReporteMuestras,
  },
  {
    id: 'reporte-pasadas',
    icono: 'pasadas',
    titulo: 'Reporte de Pasadas',
    descripcion: 'Pasadas del rango con una hoja por línea de producción; cada fila es una etapa de la pasada.',
    requiresDateRange: true,
    download: downloadReportePasadas,
  },
  {
    id: 'reporte-rutas-pasada',
    icono: 'rutas',
    titulo: 'Reporte de Rutas de Pasada',
    descripcion:
      'Configuración actual de rutas de pasada, sus etapas con pesos y los artículos asignados.',
    requiresDateRange: false,
    download: downloadReporteRutasPasada,
  },
];

interface ReporteCardProps {
  reporte: ReporteDefinicion;
  isDownloading: boolean;
  onDownload: () => void;
}

/** One report card; its icon plays while the card is hovered or has keyboard focus. */
function ReporteCard({ reporte, isDownloading, onDownload }: ReporteCardProps) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);

  return (
    <div
      className="bg-card border border-border rounded-2xl p-6 flex gap-4"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    >
      <ReporteIcon tipo={reporte.icono} active={hover || focus} />
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <h3 className="text-lg font-bold text-foreground">{reporte.titulo}</h3>
        <p className="text-sm text-muted-foreground flex-1">{reporte.descripcion}</p>

        <div>
          <button
            type="button"
            aria-label={`Descargar ${reporte.titulo}`}
            disabled={isDownloading}
            onClick={onDownload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Descargando...' : 'Descargar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const ReportesPage: React.FC = () => {
  const [modalReporte, setModalReporte] = useState<ReporteConRango | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<ReporteDescargaFase>('generando');

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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Reportes</h2>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(22rem,100%),1fr))] gap-6">
        {REPORTES.map((reporte) => (
          <ReporteCard
            key={reporte.id}
            reporte={reporte}
            isDownloading={downloadingId === reporte.id}
            onDownload={() =>
              reporte.requiresDateRange ? setModalReporte(reporte) : handleDirectDownload(reporte)
            }
          />
        ))}
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
          {loading ? (
            <ReporteDescargaProgreso fase={phase} />
          ) : (
            <form onSubmit={handleDownload} className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="desde" className="text-sm font-medium">Desde</label>
                <input
                  id="desde"
                  type="date"
                  value={desde}
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
                  onChange={(e) => setHasta(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {validationError && (desde || hasta) && (
                <p className="text-sm text-red-500">{validationError}</p>
              )}

              <button
                type="submit"
                disabled={!!validationError}
                className="mt-4 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Descargar
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
