import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../../auth/context/AuthContext';
import { useBalanzaWebSocket } from '../hooks/useBalanzaWebSocket';
import { usePasadaState} from '../hooks/usePasadaState';
//import  type { EtapaConEstado } from '../hooks/usePasadaState';
import { useActividadHeartbeat } from '../hooks/useActividadHeartbeat';
import { useStageAdvanceSignal } from '../hooks/useStageAdvanceSignal';
import { StageProgressPanel } from '../components/StageProgressPanel';
import { StageAdvanceFlash } from '../components/StageAdvanceFlash';
import { MuestraObservacionPopup } from '../components/MuestraObservacionPopup';
import { ToleranceDisplay } from '../components/ToleranceDisplay';
import { getPasada, completarPasada } from '../../../api/pasadas';
import { getLinea } from '../../../api/lineas';
import { getArticulo } from '../../../api/articulos';
import type { Articulo } from '../../../api/articulos';
import { getMuestras } from '../../../api/muestras';
import type { Pasada, RutaPasadaEtapa } from '../../../shared/types/domain';
import { PESO_DECIMALS } from '../../../shared/constants';
import { Scale, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { getAvatarInitials } from '../utils/avatarInitials';
import { isToleranceBlocked } from '../utils/tolerance';
import { useDialog } from '../../../components/dialogs/useDialog';

export const TabletWorkspace: React.FC = () => {
  const { user, activeLineaId } = useAuth();
  const { alertWarning } = useDialog();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const pasadaIdString = searchParams.get('pasadaId');
  const pasadaId = pasadaIdString ? parseInt(pasadaIdString, 10) : undefined;
  
  const lineaId = activeLineaId ?? 0;

  // Heartbeat para mantener sesión viva en backend
  useActividadHeartbeat(lineaId);

  const { pesoNeto, isConnected } = useBalanzaWebSocket(lineaId);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(null);

  // Task 3.3: Load the active run using GET /api/pasadas/:id
  // Poll every 5 s so the workspace detects if the run is aborted externally
  const {
    data: pasada,
    isLoading: loadingPasada,
  } = useQuery<Pasada>({
    queryKey: ['pasada', pasadaId],
    queryFn: () => getPasada(pasadaId!),
    enabled: !!pasadaId,
    refetchInterval: 5000,
  });

  // Load production line details to get the route and stages
  const targetLineaId = pasada?.lineaProduccionId ?? activeLineaId ?? 0;
  const {
    data: linea,
    isLoading: loadingLinea,
  } = useQuery({
    queryKey: ['linea', targetLineaId],
    queryFn: () => getLinea(targetLineaId),
    enabled: !!targetLineaId,
  });

  const etapas: RutaPasadaEtapa[] = linea?.rutaPasadaActiva?.etapas ?? [];

  // The backend's GET /pasadas/:id doesn't eager-load the articulo relation
  // (unlike GET /pasadas, which does) — MikroORM then serializes it as the
  // raw FK number under the SAME `articulo` key, not a separate `articuloId`
  // field (which doesn't exist in the real API response). Handle both shapes:
  // a plain number (unpopulated) or an already-populated object.
  const articuloRelation = pasada?.articulo as unknown as number | Articulo | undefined;
  const articuloFromPasada = typeof articuloRelation === 'object' ? articuloRelation : undefined;
  const articuloIdToFetch = typeof articuloRelation === 'number' ? articuloRelation : articuloRelation?.id;

  const { data: articuloFetched } = useQuery({
    queryKey: ['articulo', articuloIdToFetch],
    queryFn: () => getArticulo(articuloIdToFetch!),
    enabled: !!articuloIdToFetch && !articuloFromPasada,
  });

  const articulo = articuloFromPasada ?? articuloFetched;

  // Load muestras explicitly from API since Pasada payload might not include them
  const { data: muestrasList = [], isLoading: loadingMuestras } = useQuery({
    queryKey: ['muestras', pasadaId],
    queryFn: () => getMuestras(pasadaId!),
    enabled: !!pasadaId,
  });

  const {
    muestras,
    etapaActiva,
    etapasConEstado,
    addSample,
    updateSample,
    removeSample,
    clearPasada,
  } = usePasadaState({
    pasadaId,
    usuarioId: user?.id ?? 0,
    lineaProduccionId: targetLineaId,
    etapas,
    initialMuestras: muestrasList,
    onApiError: (_err: unknown) => {
      // Errors handled silently at the UI level —
      // the page remains accessible even when API calls fail.
    },
  });

  // Single source of truth for the forward/backward/none classification of
  // the derived active-etapa transition — shared by the stepper's ring pulse,
  // the samples panel swap and the one-shot flash overlay so all three stay
  // in phase (design Decision 8).
  const advanceSignal = useStageAdvanceSignal(etapasConEstado);

  // Cleanup local muestras state on unmount — prevents stale samples leaking
  // across pasadas when pasadaId is reused. Stage state is now purely
  // derived from (etapas, muestras), so there is no separate pointer to
  // reset (the "etapa fantasma" bug class this used to guard against).
  useEffect(() => {
    return () => {
      clearPasada();
    };
  }, [clearPasada]);

  // Redirect back to the pasadas list when this run has been aborted externally
  useEffect(() => {
    if (pasada?.estado === 'abortada') {
      const showWarningAndRedirect = async () => {
        await alertWarning({
          title: 'Pasada abortada',
          description: 'Esta pasada fue abortada por un administrador.',
        });
        clearPasada();
        navigate('/tablet/pasadas', { replace: true });
      };
      showWarningAndRedirect();
    }
  }, [pasada?.estado, navigate, alertWarning, clearPasada]);

  if (!activeLineaId) {
    return <Navigate to="/tablet/seleccion-linea" replace />;
  }

  if (!pasadaId) {
    return <Navigate to="/tablet/pasadas" replace />;
  }

  if (loadingPasada || loadingLinea || loadingMuestras) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin text-primary" size={36} />
        <p className="text-sm font-medium">Cargando espacio de trabajo...</p>
      </div>
    );
  }

  // Task 3.4: Bind weight capture (addSample) from WebSocket to registrarMuestra API
  const handleRegistrarMuestra = async () => {
    if (!isConnected) return;
    if (isToleranceBlockedFlag) {
      await alertWarning({
        title: 'Muestra fuera de tolerancia',
        description:
          'El peso se aleja más del 20% del ideal y el rango configurado es muy estrecho. ' +
          'Corregí el peso antes de registrar la muestra.',
      });
      return;
    }
    try {
      await addSample(pesoNeto);
    } catch {
      // usePasadaState already triggers onApiError
    }
  };

  // Task 3.5: Bind delete sample (removeSample) action to call deleteMuestra API.
  // Delete is refetch-driven, not optimistic: removeSample only calls the API,
  // so this invalidates the muestras query on success to trigger a refetch —
  // stage state then re-derives from the post-delete truth (spec:
  // "Refetch-driven recomputation").
  const handleRemoveSample = async (index: number) => {
    try {
      await removeSample(index);
      await queryClient.invalidateQueries({ queryKey: ['muestras', pasadaId] });
      setSelectedSampleIndex(null);
    } catch {
      // usePasadaState already triggers onApiError
    }
  };

  // Task 3.2: Save observation from popup via updateSample
  const handleSaveSample = async (index: number, observacion: string) => {
    await updateSample(index, { observacion });
    setSelectedSampleIndex(null);
  };


  // Task 3.6: Finalizar Pasada action
  const handleFinalizarPasada = async () => {
    try {
      await completarPasada(pasadaId);
      clearPasada();
      navigate('/tablet/pasadas');
    } catch {
      // Error handled silently — page remains accessible.
    }
  };

  // Helper variables for UI
  const currentStageId = etapaActiva?.etapa?.id ?? etapaActiva?.etapa.id;

  // Muestras list scoped to the active stage, keeping original indices for removal
  const muestrasDeEtapaActiva = muestras
    .map((muestra, originalIndex) => ({ muestra, originalIndex }))
    .filter(({ muestra }) => muestra.etapaId === currentStageId);

  // Phase 4: Tolerance bar + OK/Fuera-de-Rango badge (only meaningful with an active stage)
  // Note: `etapaActiva` (from usePasadaState) is the RutaPasadaEtapa wrapper itself —
  // pesoMinimo/pesoIdeal/pesoMaximo live directly on it, NOT nested under `.etapa`
  // (that nested `.etapa` is only the stage name/id detail, e.g. `.etapa.nombre`).
  const pesoMinimo = etapaActiva?.pesoMinimo;
  const pesoIdeal = etapaActiva?.pesoIdeal;
  const pesoMaximo = etapaActiva?.pesoMaximo;
  const hasTolerancia = pesoMinimo !== undefined && pesoIdeal !== undefined && pesoMaximo !== undefined;
  // ux-polish Task 1: guard against out-of-tolerance samples when the admin's
  // configured range is too tight to absorb the deviation. The button stays
  // clickable (NOT disabled) so the operator gets an alertWarning popup.
  const isToleranceBlockedFlag =
    hasTolerancia &&
    etapaActiva !== null &&
    isToleranceBlocked(pesoNeto, pesoIdeal!, pesoMinimo!, pesoMaximo!);


  // Phase 4: PasadaBlock start-time formatting (native Intl, no date library)
  const inicioLabel = pasada?.horaInicio
    ? new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
        new Date(pasada.horaInicio),
      )
    : '--:--';

  return (
    <div className="min-h-screen lg:h-screen flex flex-col p-4 bg-background gap-4 relative overflow-y-auto lg:overflow-hidden">

      {/* Topbar */}
      <div className="flex flex-nowrap flex-shrink-0 justify-between items-center gap-3 bg-card p-3 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-4">
          <span className="px-2 py-0.5 rounded-md border border-primary bg-primary/10 text-primary text-xs font-bold tracking-wide">
            {linea?.nombre ?? `Línea ${lineaId}`}
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">
              {articulo ? (articulo.nombre ? `${articulo.nombre} - ${articulo.codigo}` : articulo.codigo) : '—'}
            </span>
            <span className="text-sm text-muted-foreground">
              Ruta: {linea?.rutaPasadaActiva?.nombre ?? '—'}
              <span className="hidden min-[570px]:inline"> · Pasada #{pasada?.numero ?? '—'}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-nowrap items-center gap-4">
          <div className="hidden min-[700px]:flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
              {getAvatarInitials(user?.nombreUsuario)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{user?.nombreUsuario}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.rol}</span>
            </div>
          </div>
          <button
            onClick={() => { clearPasada(); navigate('/tablet/pasadas'); }}
            aria-label="Volver"
            className="flex items-center justify-center gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold transition-colors
              p-3 rounded-full min-[490px]:px-4 min-[490px]:py-2 min-[490px]:rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 min-[490px]:hidden" />
            <span className="hidden min-[490px]:inline">Volver</span>
          </button>
        </div>
      </div>

      <div className="flex-shrink-0">
        <StageProgressPanel etapasConEstado={etapasConEstado} advanceSignal={advanceSignal} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-[860fr_340fr] gap-4">

        {/* Balanza Panel */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-5 flex flex-col items-center justify-center min-h-0 overflow-y-auto gap-3">
          <div className="flex items-center justify-center gap-4">
            <Scale className={`w-12 h-12 flex-shrink-0 ${isConnected ? 'text-primary' : 'text-muted-foreground/40'}`} />
            <div className="text-center">
              <span className="text-6xl font-black text-foreground tabular-nums">
                {pesoNeto.toFixed(PESO_DECIMALS)}
              </span>
              <span className="text-2xl text-muted-foreground ml-2">kg</span>
            </div>
          </div>

          {etapaActiva && hasTolerancia ? (
            <ToleranceDisplay
              pesoNeto={pesoNeto}
              pesoMinimo={pesoMinimo!}
              pesoIdeal={pesoIdeal!}
              pesoMaximo={pesoMaximo!}
              variant="primary"
            />
          ) : etapaActiva === null ? (
            <div className="w-full flex items-center justify-center gap-2 text-success font-semibold">
              <CheckCircle2 className="w-6 h-6" />
              Listo para finalizar
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-warning'}`} />
            <span className="text-base font-medium text-muted-foreground">
              {isConnected ? 'Conectado' : 'Sin señal'}
            </span>
          </div>

          <button
            onClick={handleRegistrarMuestra}
            disabled={!isConnected || etapaActiva === null}
            className={`w-full py-4 rounded-2xl text-xl font-bold transition-all shadow-lg
              ${isConnected && etapaActiva !== null && !isToleranceBlockedFlag
                ? 'bg-success hover:bg-success/90 text-white active:scale-95'
                : isToleranceBlockedFlag
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
          >
            Registrar Muestra
          </button>
        </div>

        {/* Muestras List */}
        <div className="relative bg-card rounded-xl shadow-sm border border-border flex flex-col min-h-0 max-h-[70vh] lg:max-h-none">
          <div className="p-3 border-b border-border flex justify-between items-center bg-muted rounded-t-xl flex-shrink-0">
            <h3 className="text-lg font-bold text-foreground">Muestras Registradas</h3>
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-foreground">Pasada #{pasada?.numero ?? '—'}</span>
              <span className="text-xs text-muted-foreground">Inicio {inicioLabel}</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStageId ?? 'sin-etapa'}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {muestrasDeEtapaActiva.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <p>No hay muestras en esta etapa.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {muestrasDeEtapaActiva.map(({ muestra, originalIndex }, displayIndex) => (
                      <li
                        key={muestra.id ?? originalIndex}
                        onClick={() => setSelectedSampleIndex(originalIndex)}
                        className="flex justify-between items-center p-4 bg-muted hover:bg-accent rounded-xl border border-border cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-8 h-8 flex items-center justify-center bg-secondary rounded-full font-bold text-secondary-foreground text-sm">
                            {displayIndex + 1}
                          </span>
                          <span className="text-xl font-bold tabular-nums text-foreground">
                            {muestra.pesoNeto.toFixed(PESO_DECIMALS)} kg
                          </span>
                        </div>
                        {muestra.estadoValidacion === 'ok'
                          ? <span className="text-success font-medium">En Rango</span>
                          : <span className="text-danger font-medium">Fuera de Rango</span>
                        }
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <StageAdvanceFlash signal={advanceSignal} />

          {/* Task 3.6: Explicit "Finalizar Pasada" action. Stage advance
              between etapas is fully automatic/derived (spec: "Derived
              current-stage computation") — there is no manual per-stage
              button anymore. Finalizing the whole pasada stays an explicit,
              persisted server transition and is only offered once every
              etapa is derived as completada (etapaActiva === null). */}
          {etapaActiva === null && etapas.length > 0 && (
            <div className="p-4 border-t border-border flex-shrink-0">
              <button
                onClick={handleFinalizarPasada}
                className="w-full py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-2 transition-all bg-success hover:bg-success/90 text-white shadow-lg active:scale-95"
              >
                <CheckCircle2 className="w-6 h-6" />
                Finalizar Pasada
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MuestraObservacionPopup — shared edit/delete popup (task 3.2) */}
      {selectedSampleIndex !== null && muestras[selectedSampleIndex] && (
        <MuestraObservacionPopup
          muestra={muestras[selectedSampleIndex]}
          index={selectedSampleIndex}
          isOpen
          onSave={handleSaveSample}
          onDelete={handleRemoveSample}
          onClose={() => setSelectedSampleIndex(null)}
        />
      )}

    </div>
  );
};
