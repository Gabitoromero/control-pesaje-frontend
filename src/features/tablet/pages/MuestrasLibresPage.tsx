import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Scale } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { useBalanzaWebSocket } from '../hooks/useBalanzaWebSocket';
import { useMuestrasLibresContext } from '../context/MuestrasLibresContext';
import { MuestrasListPanel } from '../components/MuestrasListPanel';
import { MuestraObservacionPopup } from '../components/MuestraObservacionPopup';
import { ToleranceDisplay } from '../components/ToleranceDisplay';
import { getLinea } from '../../../api/lineas';
import { getAvatarInitials } from '../utils/avatarInitials';

/**
 * Unified Muestras Libres page: amber-themed topbar (structural duplicate of
 * TabletWorkspace's topbar with the accent swapped from primary/cyan to
 * warning/amber — see design D6, not extracted to keep TabletWorkspace's
 * scope untouched), a flat etapa pill selector (no locking/progression), a
 * weighing zone reusing <ToleranceDisplay variant="warning">, a samples
 * panel filtered to the selected etapa, and an always-visible top-right
 * Finalizar button (destructive/red styling matching TabletWorkspace's
 * Volver, away from Registrar) with no confirmation — clears the session
 * before navigating away.
 */
export function MuestrasLibresPage() {
  const { user, activeLineaId } = useAuth();
  const navigate = useNavigate();
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(null);

  const { pesoNeto, isConnected } = useBalanzaWebSocket(activeLineaId ?? 0);
  const {
    muestras,
    etapas,
    selectedEtapaId,
    selectedEtapa,
    setSelectedEtapaId,
    addSample,
    updateSample,
    removeSample,
    clearSession,
    isRegistering,
  } = useMuestrasLibresContext();

  // Topbar display info (linea nombre + ruta nombre) — same query key as
  // MuestrasLibresLayout/GestionPasadasPage, so react-query dedupes the fetch.
  const { data: linea } = useQuery({
    queryKey: ['linea', activeLineaId],
    queryFn: () => getLinea(activeLineaId!),
    enabled: !!activeLineaId,
  });

  // R4.2: samples are session-local client state (never fetched per-etapa),
  // so filtering + index-translation is pure client-side derivation.
  const muestrasFiltradas = useMemo(
    () =>
      muestras
        .map((muestra, originalIndex) => ({ muestra, originalIndex }))
        .filter(({ muestra }) => muestra.etapaId === selectedEtapaId),
    [muestras, selectedEtapaId]
  );

  // R6.4: guard/empty state matching GestionPasadasPage's sinRutaAsignada
  // pattern — no pill row, no weighing zone attempting undefined tolerance.
  if (etapas.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4 text-center">
        <AlertTriangle size={40} className="text-warning" />
        <h2 className="text-xl font-bold text-foreground">Sin ruta de pesaje asignada</h2>
        <p className="text-muted-foreground max-w-md">
          Esta línea de producción no tiene una ruta activa configurada. No es posible tomar
          muestras libres hasta que un administrador asigne una ruta.
        </p>
      </div>
    );
  }

  const handleRegistrar = async () => {
    await addSample(pesoNeto);
  };

  const handleFinalizar = () => {
    clearSession();
    navigate('/tablet/pasadas');
  };

  const handleSaveSample = async (index: number, observacion: string) => {
    await updateSample(index, { observacion });
    setSelectedSampleIndex(null);
  };

  const handleDeleteSample = async (index: number) => {
    await removeSample(index);
    setSelectedSampleIndex(null);
  };

  const pesoMinimo = selectedEtapa?.pesoMinimo;
  const pesoIdeal = selectedEtapa?.pesoIdeal;
  const pesoMaximo = selectedEtapa?.pesoMaximo;
  const hasTolerancia = pesoMinimo !== undefined && pesoIdeal !== undefined && pesoMaximo !== undefined;

  return (
    <div className="min-h-screen lg:h-screen flex flex-col p-4 bg-background gap-4 relative overflow-y-auto lg:overflow-hidden">
      {/* Topbar — structural duplicate of TabletWorkspace's, primary→warning swap */}
      <div className="flex flex-nowrap flex-shrink-0 justify-between items-center gap-3 bg-card p-3 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-4">
          <span className="px-2 py-0.5 rounded-md border border-warning bg-warning/10 text-warning text-xs font-bold tracking-wide">
            {linea?.nombre ?? `Línea ${activeLineaId}`}
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">Muestras de Calidad Libre</span>
            <span className="text-sm text-muted-foreground">
              Ruta: {linea?.rutaPasadaActiva?.nombre ?? '—'}
            </span>
          </div>
        </div>
        <div className="flex flex-nowrap items-center gap-4">
          <div className="hidden min-[700px]:flex items-center gap-4">
            <span className="px-2 py-0.5 rounded-md border border-warning bg-warning/10 text-warning text-xs font-bold tracking-wide">
              MUESTRAS LIBRES
            </span>
            <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
              {getAvatarInitials(user?.nombreUsuario)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{user?.nombreUsuario}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.rol}</span>
            </div>
          </div>
          <button
            onClick={handleFinalizar}
            aria-label="Finalizar muestras aleatorias"
            className="flex items-center justify-center gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold transition-colors
              p-3 rounded-full min-[490px]:px-4 min-[490px]:py-2 min-[490px]:rounded-lg"
          >
            <CheckCircle2 className="w-5 h-5 min-[490px]:hidden" />
            <span className="hidden min-[490px]:inline">Finalizar Muestras</span>
          </button>
        </div>
      </div>

      {/* Etapa selector — flat pill row, any etapa clickable anytime (no locking) */}
      <div className="flex-shrink-0 flex flex-wrap gap-2">
        {etapas.map((rutaEtapa) => {
          const isSelected = rutaEtapa.etapa.id === selectedEtapaId;
          return (
            <button
              key={rutaEtapa.etapa.id}
              type="button"
              onClick={() => setSelectedEtapaId(rutaEtapa.etapa.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border active:scale-95
                ${isSelected
                  ? 'bg-warning border-warning text-warning-foreground'
                  : 'bg-muted border-border text-foreground hover:bg-accent'
                }`}
            >
              {rutaEtapa.etapa.nombre}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-[860fr_340fr] gap-4">
        {/* Weighing zone */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-5 flex flex-col items-center justify-center min-h-0 overflow-y-auto gap-3">
          <div className="flex items-center justify-center gap-4">
            <Scale className={`w-12 h-12 flex-shrink-0 ${isConnected ? 'text-warning' : 'text-muted-foreground/40'}`} />
            <div className="text-center">
              <span className="text-6xl font-black text-foreground tabular-nums">
                {pesoNeto.toFixed(3)}
              </span>
              <span className="text-2xl text-muted-foreground ml-2">kg</span>
            </div>
          </div>

          {selectedEtapa && hasTolerancia && (
            <ToleranceDisplay
              pesoNeto={pesoNeto}
              pesoMinimo={pesoMinimo!}
              pesoIdeal={pesoIdeal!}
              pesoMaximo={pesoMaximo!}
              variant="warning"
            />
          )}

          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-warning'}`} />
            <span className="text-base font-medium text-muted-foreground">
              {isConnected ? 'Conectado' : 'Sin señal'}
            </span>
          </div>

          <button
            onClick={handleRegistrar}
            disabled={!isConnected || isRegistering || selectedEtapaId === null}
            className={`w-full py-4 rounded-2xl text-xl font-bold transition-all shadow-lg
              ${isConnected && !isRegistering && selectedEtapaId !== null
                ? 'bg-warning hover:bg-warning/90 text-warning-foreground active:scale-95'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
          >
            Registrar Muestra de Calidad
          </button>
        </div>

        {/* Samples panel — filtered to the currently-selected etapa */}
        <div className="bg-card rounded-xl shadow-sm border border-border flex flex-col min-h-0 max-h-[70vh] lg:max-h-none">
          <div className="p-3 border-b border-border flex justify-between items-center bg-muted rounded-t-xl flex-shrink-0">
            <h3 className="text-lg font-bold text-foreground">Muestras Registradas</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <MuestrasListPanel
              muestras={muestrasFiltradas.map(({ muestra }) => muestra)}
              onSampleClick={(filteredIndex) =>
                setSelectedSampleIndex(muestrasFiltradas[filteredIndex].originalIndex)
              }
              emptyMessage="Sin muestras registradas para esta etapa"
            />
          </div>
        </div>
      </div>

      {selectedSampleIndex !== null && muestras[selectedSampleIndex] && (
        <MuestraObservacionPopup
          muestra={muestras[selectedSampleIndex]}
          index={selectedSampleIndex}
          isOpen
          onSave={handleSaveSample}
          onDelete={handleDeleteSample}
          onClose={() => setSelectedSampleIndex(null)}
        />
      )}
    </div>
  );
}
