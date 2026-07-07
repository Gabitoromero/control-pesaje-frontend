import React, { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/context/AuthContext';
import { useBalanzaWebSocket } from '../hooks/useBalanzaWebSocket';
import { usePasadaState} from '../hooks/usePasadaState';
//import  type { EtapaConEstado } from '../hooks/usePasadaState';
import { useActividadHeartbeat } from '../hooks/useActividadHeartbeat';
import { StageProgressPanel } from '../components/StageProgressPanel';
import { MuestraObservacionPopup } from '../components/MuestraObservacionPopup';
import { getPasada, completarPasada } from '../../../api/pasadas';
import { getLinea } from '../../../api/lineas';
import { getMuestras } from '../../../api/muestras';
import type { Pasada, RutaPasadaEtapa } from '../../../shared/types/domain';
import { Scale, CheckCircle2, Loader2 } from 'lucide-react';

export const TabletWorkspace: React.FC = () => {
  const { user, activeLineaId } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pasadaIdString = searchParams.get('pasadaId');
  const pasadaId = pasadaIdString ? parseInt(pasadaIdString, 10) : undefined;
  
  const lineaId = activeLineaId ?? 0;

  // Heartbeat para mantener sesión viva en backend
  useActividadHeartbeat(lineaId);

  const { pesoNeto, isConnected } = useBalanzaWebSocket(lineaId);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(null);

  // Task 3.3: Load the active run using GET /api/pasadas/:id
  const {
    data: pasada,
    isLoading: loadingPasada,
    error: errorPasada,
    refetch: refetchPasada,
  } = useQuery<Pasada>({
    queryKey: ['pasada', pasadaId],
    queryFn: () => getPasada(pasadaId!),
    enabled: !!pasadaId,
  });

  // Load production line details to get the route and stages
  const targetLineaId = pasada?.lineaProduccionId ?? activeLineaId ?? 0;
  const {
    data: linea,
    isLoading: loadingLinea,
    error: errorLinea,
  } = useQuery({
    queryKey: ['linea', targetLineaId],
    queryFn: () => getLinea(targetLineaId),
    enabled: !!targetLineaId,
  });

  const etapas: RutaPasadaEtapa[] = linea?.rutaPasadaActiva?.etapas ?? [];

  // Load muestras explicitly from API since Pasada payload might not include them
  const { data: muestrasList = [], isLoading: loadingMuestras } = useQuery({
    queryKey: ['muestras', pasadaId],
    queryFn: () => getMuestras(pasadaId!),
    enabled: !!pasadaId,
  });

  // Hook up hook with API integration and client-side derived active stage calculation
  const {
    muestras,
    etapaActiva,
    etapasConEstado,
    addSample,
    updateSample,
    removeSample,
    finalizarEtapaActual,
  } = usePasadaState({
    pasadaId,
    usuarioId: user?.id ?? 0,
    lineaProduccionId: targetLineaId,
    articuloId: pasada?.articuloId,
    etapas,
    initialMuestras: muestrasList,
    onApiError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const msg = axiosErr.response?.data?.error?.message || axiosErr.message || 'Error de comunicación';
      setApiError(msg);
    },
  });

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
    if (isConnected) {
      try {
        await addSample(pesoNeto);
      } catch {
        // usePasadaState already triggers onApiError
      }
    }
  };

  // Task 3.5: Bind delete sample (removeSample) action to call deleteMuestra API
  const handleRemoveSample = async (index: number) => {
    try {
      await removeSample(index);
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
      navigate('/tablet/pasadas');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const msg = axiosErr.response?.data?.error?.message || axiosErr.message || 'Error al completar pasada';
      setApiError(msg);
    }
  };

  // Helper variables for UI
  const currentStageId = etapaActiva?.etapa?.id ?? etapaActiva?.etapa.id;

  // Only count 'ok' samples for progress, but show all samples of the active stage in the list
  const samplesForActiveStage = muestras.filter(
    (m) => m.etapaId === currentStageId && m.estadoValidacion === 'ok'
  );

  // Muestras list scoped to the active stage, keeping original indices for removal
  const muestrasDeEtapaActiva = muestras
    .map((muestra, originalIndex) => ({ muestra, originalIndex }))
    .filter(({ muestra }) => muestra.etapaId === currentStageId);

  const activeStageName = etapaActiva?.etapa?.nombre ?? etapaActiva?.etapa.nombre ?? 'Completado';
  const activeStageRequired = etapaActiva?.cantidadMuestrasRequeridas ?? etapaActiva?.cantidadMuestrasRequeridas ?? 0;
  
  // Task 3.7: Render Lockout Overlay when isConnected is false or API requests fail
  const showLockout = !isConnected || !!apiError || !!errorPasada || !!errorLinea;

  return (
    <div className="h-full flex flex-col p-6 bg-background gap-6 relative">

      {/* Header Info */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl shadow-sm border border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground">Línea {lineaId}</h2>
          <p className="text-muted-foreground">Operario: {user?.nombreUsuario ?? 'Desconocido'}</p>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {activeStageName}
            </h3>
            {etapaActiva ? (
              <p className="text-muted-foreground">
                Muestras: {samplesForActiveStage.length} / {activeStageRequired}
              </p>
            ) : (
              <p className="text-success font-semibold flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-4 h-4" />
                Listo para finalizar
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/tablet/pasadas')}
            className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-accent rounded-lg font-bold transition-colors"
          >
            Volver
          </button>
        </div>
      </div>

      <StageProgressPanel etapasConEstado={etapasConEstado} />

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Balanza Panel */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-8 flex flex-col items-center justify-center">
          <Scale className={`w-24 h-24 mb-6 ${isConnected ? 'text-primary' : 'text-muted-foreground/40'}`} />

          <div className="text-center mb-8">
            <span className="text-8xl font-black text-foreground tabular-nums">
              {pesoNeto.toFixed(3)}
            </span>
            <span className="text-3xl text-muted-foreground ml-2">kg</span>
          </div>

          <div className="flex items-center gap-3 mb-10">
            <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-success' : 'bg-warning'}`} />
            <span className="text-xl font-medium text-muted-foreground">
              {isConnected ? 'Conectado' : 'Sin señal'}
            </span>
          </div>

          <button
            onClick={handleRegistrarMuestra}
            disabled={!isConnected || etapaActiva === null}
            className={`w-full py-6 rounded-2xl text-2xl font-bold transition-all shadow-lg
              ${isConnected && etapaActiva !== null
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
          >
            Registrar Muestra
          </button>
        </div>

        {/* Muestras List */}
        <div className="bg-card rounded-xl shadow-sm border border-border flex flex-col">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted rounded-t-xl">
            <h3 className="text-lg font-bold text-foreground">Muestras Registradas</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
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
                      <div>
                        <span className="text-xl font-bold tabular-nums text-foreground">
                          {muestra.pesoNeto.toFixed(3)} kg
                        </span>
                        <div className="text-sm mt-1 flex items-center gap-2">
                          {muestra.estadoValidacion === 'ok'
                            ? <span className="text-success font-medium">En Rango</span>
                            : <span className="text-danger font-medium">Fuera de Rango</span>
                          }
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Task 3.6: Manual Stage / Pasada progression button */}
          <div className="p-4 border-t border-border">
            {etapaActiva !== null ? (() => {
              const isActiveStageComplete = samplesForActiveStage.length >= activeStageRequired;
              const isLastStage = etapasConEstado.length > 0 &&
                                  etapasConEstado[etapasConEstado.length - 1].etapa.etapa.id === etapaActiva.etapa.id;

              return (
                <button
                  onClick={isLastStage ? handleFinalizarPasada : finalizarEtapaActual}
                  disabled={!isActiveStageComplete}
                  className={`w-full py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-2 transition-all
                    ${isActiveStageComplete
                      ? 'bg-success hover:bg-success/90 text-white shadow-lg active:scale-95'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                >
                  <CheckCircle2 className="w-6 h-6" />
                  {isLastStage ? 'Finalizar Pasada' : 'Siguiente Etapa'}
                </button>
              );
            })() : etapas.length > 0 ? (
              <button
                onClick={handleFinalizarPasada}
                className="w-full py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-2 transition-all bg-success hover:bg-success/90 text-white shadow-lg active:scale-95"
              >
                <CheckCircle2 className="w-6 h-6" />
                Finalizar Pasada
              </button>
            ) : null}
          </div>
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

      {/* Lockout Overlay */}
      {showLockout && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md p-6 select-none animate-fade-in">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full text-center shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-danger-muted border border-danger/20 flex items-center justify-center mb-6 text-danger animate-pulse">
              <Scale size={32} />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {!isConnected ? 'Señal de Balanza Perdida' : 'Error de Conexión'}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {!isConnected
                ? 'La comunicación con la balanza se ha interrumpido. Verifique la conexión para continuar.'
                : 'Hubo un problema al comunicarse con el servidor o procesar la solicitud.'}
            </p>
            {(apiError || errorPasada || errorLinea) && (
              <div className="bg-danger-muted border border-danger/30 rounded-xl p-3 text-xs text-danger mb-6 font-mono break-all max-h-32 overflow-y-auto">
                {apiError || (errorPasada as { response?: { data?: { error?: { message?: string } }; }; message?: string })?.response?.data?.error?.message ||
                   (errorPasada as { message?: string })?.message ||
                   (errorLinea as { response?: { data?: { error?: { message?: string } }; }; message?: string })?.response?.data?.error?.message ||
                   (errorLinea as { message?: string })?.message}
              </div>
            )}
            <button
              onClick={() => {
                setApiError(null);
                refetchPasada();
              }}
              className="w-full py-3.5 bg-secondary hover:bg-accent active:scale-95 text-secondary-foreground rounded-xl text-sm font-semibold transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
