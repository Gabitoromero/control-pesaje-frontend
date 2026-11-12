import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, FlaskConical } from 'lucide-react';
import { getMuestras } from '../../../api/muestras';
import { getRuta } from '../../../api/rutas';
import { esPasadaDeVerificacion } from '../utils/verificacion';
import { normalizeMuestra } from '../utils/muestra.utils';
import { deriveStageProgress } from '../utils/stageProgress';
import { StagePillRow } from './StagePillRow';
import type { Pasada, Ruta, RutaPasadaEtapa } from '../../../shared/types/domain';

interface PasadaCardProps {
  pasada: Pasada;
  // Etapas of the línea's active ruta: used when the pasada runs that same ruta.
  etapas: RutaPasadaEtapa[];
  // Id of the línea's active ruta, to tell whether the pasada runs a different one (verification).
  rutaActivaId?: number;
}

function getArticuloNombre(pasada: Pasada): string {
  if (pasada.articulo) {
    const brand = pasada.articulo.nombre ? `${pasada.articulo.nombre} - ` : '';
    return `${brand}${pasada.articulo.codigo}`;
  }
  if (pasada.articuloId !== undefined) {
    return `Artículo #${pasada.articuloId}`;
  }
  return 'Artículo desconocido';
}

export function PasadaCard({ pasada, etapas: etapasDeLaLinea, rutaActivaId }: PasadaCardProps) {
  const navigate = useNavigate();
  const verificacion = esPasadaDeVerificacion(pasada);

  // A pasada can run a ruta other than the línea's active one (verification). The list endpoint
  // serializes the relation as the raw FK number (or an object when populated); in that case the
  // stages come from the pasada's own ruta, never from the línea's.
  const rutaRelation = (pasada as Pasada & { rutaPasada?: number | Ruta | null }).rutaPasada;
  const rutaPropiaId = typeof rutaRelation === 'object' && rutaRelation !== null ? rutaRelation.id : rutaRelation;
  const usaRutaPropia = rutaPropiaId !== undefined && rutaPropiaId !== null && rutaPropiaId !== rutaActivaId;
  const rutaPopulada = typeof rutaRelation === 'object' && rutaRelation !== null ? rutaRelation : undefined;

  const { data: rutaFetched } = useQuery({
    queryKey: ['ruta', rutaPropiaId],
    queryFn: () => getRuta(rutaPropiaId as number),
    enabled: usaRutaPropia && !rutaPopulada?.etapas,
  });
  const etapas: RutaPasadaEtapa[] = usaRutaPropia
    ? (rutaPopulada?.etapas ?? rutaFetched?.etapas ?? []) // loading → no stages (never the línea's)
    : etapasDeLaLinea;

  // The backend's list endpoint doesn't eager-load the muestra->etapa
  // relation, so raw API results carry `etapa` as an FK number, not the
  // `etapaId` field this component (and deriveStageProgress) reads.
  // normalizeMuestra resolves both shapes — same convention usePasadaState
  // already applies to TabletWorkspace's initial muestras.
  const { data: rawMuestras = [] } = useQuery({
    queryKey: ['muestras', pasada.id],
    queryFn: () => getMuestras(pasada.id),
    enabled: !!pasada.id,
  });
  const muestras = rawMuestras.map(normalizeMuestra);

  const { currentIndex, total } = deriveStageProgress(etapas, muestras);

  const inicioLabel = pasada.horaInicio
    ? new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
        new Date(pasada.horaInicio),
      )
    : '--:--';

  return (
    <div
      data-testid="pasada-card"
      className={`rounded-xl p-5 flex flex-col gap-3 border ${
        verificacion ? 'bg-warning/10 border-warning/60' : 'bg-card border-border'
      }`}
    >
      <div>
        {verificacion && (
          <span className="mb-1 inline-flex items-center gap-1 rounded-md border border-warning/60 bg-warning/20 px-2 py-0.5 text-xs font-bold text-warning">
            <FlaskConical size={12} />
            Verificación
          </span>
        )}
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
