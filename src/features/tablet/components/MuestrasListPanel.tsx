import type { Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';

interface MuestrasListPanelProps {
  muestras: Muestra[];
  onRemoveSample: (index: number) => Promise<void>;
  emptyMessage?: string;
  etapas?: RutaPasadaEtapa[];
}

export function MuestrasListPanel({
  muestras,
  onRemoveSample,
  emptyMessage = 'No hay muestras registradas en esta sesión.',
  etapas,
}: MuestrasListPanelProps) {
  if (muestras.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-4">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {muestras.map((m, i) => {
        const stageName = etapas?.find(e => e.etapa.id === m.etapaId)?.etapa.nombre;
        return (
        <div
          key={m.id ?? i}
          className="flex items-center justify-between text-sm bg-slate-700/50 rounded-lg px-3 py-1.5"
        >
          <span className="text-slate-300">#{i + 1}</span>
          {stageName && <span className="text-slate-400 text-xs truncate max-w-[100px]">{stageName}</span>}
          <span className="font-medium text-white">{m.pesoNeto.toFixed(3)} kg</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              m.estadoValidacion === 'ok'
                ? 'bg-green-900/50 text-green-400'
                : 'bg-red-900/50 text-red-400'
            }`}
          >
            {m.estadoValidacion}
          </span>
          <button
            type="button"
            aria-label="Eliminar muestra"
            onClick={() => onRemoveSample(i)}
            className="ml-2 text-slate-400 hover:text-red-400 transition-colors"
          >
            ✕
          </button>
        </div>
        );
      })}
    </div>
  );
}
