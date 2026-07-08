import React from 'react';
import { Download } from 'lucide-react';

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
];

export const ReportesPage: React.FC = () => {
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
