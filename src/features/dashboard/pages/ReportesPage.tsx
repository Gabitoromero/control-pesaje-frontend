import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { downloadReportePasadasMuestras } from '@/api/reportes';

interface ReporteDefinicion {
  id: string;
  titulo: string;
  descripcion: string;
}

const REPORTES: ReporteDefinicion[] = [
  {
    id: 'rendimiento-fisico',
    titulo: 'Listado de Pasadas por Ruta',
    descripcion: 'Listado de pasadas por ruta.',
  },
  {
    id: 'trazabilidad-comercial',
    titulo: 'Muestras por Ruta y Fecha',
    descripcion: 'Historial de muestras por ruta y fecha.',
  },
  {
    id: 'reporte-pasadas-muestras',
    titulo: 'Reporte de Pasadas y Muestras',
    descripcion: 'Reporte de pasadas y muestras consolidado.',
  },
];

export const ReportesPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [loading, setLoading] = useState(false);

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
    const diffTime = dHasta.getTime() - dDesde.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays > 5) {
      return 'El rango de fechas no puede ser mayor a 5 días.';
    }
    return null;
  };

  const validationError = validateDates();

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;

    try {
      setLoading(true);
      await downloadReportePasadasMuestras(desde, hasta);
      setModalOpen(false);
    } catch (error) {
      console.error('Error al descargar el reporte', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Reportes</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {REPORTES.map((reporte) => (
          <div
            key={reporte.id}
            className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-3"
          >
            <h3 className="text-lg font-bold text-foreground">{reporte.titulo}</h3>
            <p className="text-sm text-muted-foreground flex-1">{reporte.descripcion}</p>

            <div>
              {reporte.id === 'reporte-pasadas-muestras' ? (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled
                    title="Disponible próximamente"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-muted text-muted-foreground cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Descargar .xlsx
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">Disponible próximamente</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descargar Reporte</DialogTitle>
          </DialogHeader>
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
