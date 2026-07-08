import type { Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';

interface MuestrasListPanelProps {
  muestras: Muestra[];
  onSampleClick: (index: number) => void;
  emptyMessage?: string;
  etapas?: RutaPasadaEtapa[];
}

export function MuestrasListPanel({
  muestras,
  onSampleClick,
  emptyMessage = 'No hay muestras registradas en esta sesión.',
  etapas,
}: MuestrasListPanelProps) {
  if (muestras.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {muestras.map((m, i) => {
        const stageName = etapas?.find(e => e.etapa.id === m.etapaId)?.etapa.nombre;
        return (
        <button
          key={m.id ?? i}
          type="button"
          onClick={() => onSampleClick(i)}
          className="w-full flex items-center justify-between text-sm bg-muted hover:bg-accent border border-border rounded-lg px-3 py-1.5 transition-colors text-left"
        >
          <span className="text-muted-foreground">#{i + 1}</span>
          {stageName && <span className="text-muted-foreground text-xs truncate max-w-[100px]">{stageName}</span>}
          <span className="font-medium text-foreground">{m.pesoNeto.toFixed(3)} kg</span>
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
