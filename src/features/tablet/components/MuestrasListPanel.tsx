import type { Magnitud, Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';
import { unidadLabel } from '../../../shared/peso';
import { PESO_DECIMALS } from '../../../shared/constants';

interface MuestrasListPanelProps {
  muestras: Muestra[];
  onSampleClick: (index: number) => void;
  emptyMessage?: string;
  etapas?: RutaPasadaEtapa[];
  /** Magnitud for samples whose etapa is not in `etapas` (or when no etapas are given). */
  magnitud?: Magnitud;
}

export function MuestrasListPanel({
  muestras,
  onSampleClick,
  emptyMessage = 'No hay muestras registradas en esta sesión.',
  etapas,
  magnitud,
}: MuestrasListPanelProps) {
  if (muestras.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {muestras.map((m, i) => {
        const rutaEtapa = etapas?.find(e => e.etapa.id === m.etapaId);
        const stageName = rutaEtapa?.etapa.nombre;
        const unidad = unidadLabel('kg', rutaEtapa?.magnitud ?? magnitud);
        return (
        <button
          key={m.id ?? i}
          type="button"
          onClick={() => onSampleClick(i)}
          className="w-full flex items-center justify-between text-sm bg-muted hover:bg-accent border border-border rounded-lg px-3 py-1.5 transition-colors text-left"
        >
          <span className="text-muted-foreground">#{i + 1}</span>
          {stageName && <span className="text-muted-foreground text-xs truncate max-w-[100px]">{stageName}</span>}
          <span className="font-medium text-foreground">{m.pesoNeto.toFixed(PESO_DECIMALS)} {unidad}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              m.estadoValidacion === 'ok'
                ? 'bg-success-muted text-success'
                : 'bg-danger-muted text-danger'
            }`}
          >
            {m.estadoValidacion}
          </span>
        </button>
        );
      })}
    </div>
  );
}
