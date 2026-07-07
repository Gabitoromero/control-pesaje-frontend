import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { getMuestras } from '../../../api/muestras';
import { deriveStageProgress } from '../utils/stageProgress';
import { StagePillRow } from './StagePillRow';
import type { Pasada, RutaPasadaEtapa } from '../../../shared/types/domain';

interface PasadaCardProps {
  pasada: Pasada;
  etapas: RutaPasadaEtapa[];
}

function getArticuloNombre(pasada: Pasada): string {
  if (pasada.articulo) {
    const brand = pasada.articulo.marca ? `${pasada.articulo.marca} - ` : '';
    return `${brand}${pasada.articulo.nombre}`;
  }
  if (pasada.articuloId !== undefined) {
    return `Artículo #${pasada.articuloId}`;
  }
  return 'Artículo desconocido';
}

export function PasadaCard({ pasada, etapas }: PasadaCardProps) {
  const navigate = useNavigate();

  const { data: muestras = [] } = useQuery({
    queryKey: ['muestras', pasada.id],
    queryFn: () => getMuestras(pasada.id),
    enabled: !!pasada.id,
  });

  const { currentIndex, total } = deriveStageProgress(etapas, muestras);

  const inicioLabel = pasada.horaInicio
    ? new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
        new Date(pasada.horaInicio),
      )
    : '--:--';

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
      <div>
        <h3 className="text-lg font-bold text-foreground">Pasada #{pasada.numero ?? pasada.id}</h3>
        <p className="text-foreground">{getArticuloNombre(pasada)}</p>
      </div>

      <p className="text-sm text-muted-foreground">
        Inicio {inicioLabel} · Avance: Etapa {currentIndex} de {total}
      </p>

      <StagePillRow etapas={etapas} muestras={muestras} />

      <button
        onClick={() => navigate(`/tablet?pasadaId=${pasada.id}`)}
        className="mt-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-95"
      >
        <Play size={16} />
        Continuar
      </button>
    </div>
  );
}
