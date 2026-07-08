import { useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import type { Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';
import { registrarMuestra, deleteMuestra, updateMuestra } from '../../../api/muestras';
import { normalizeMuestra } from '../utils/muestra.utils';

export const MAX_FREE_SAMPLES = 20;

export interface UseMuestrasLibresProps {
  lineaProduccionId: number;
  usuarioId: number;
  etapas: RutaPasadaEtapa[];
  onApiError?: (e: unknown) => void;
}

export interface UseMuestrasLibresResult {
  muestras: Muestra[];
  etapas: RutaPasadaEtapa[];
  selectedEtapaId: number | null;
  selectedEtapa: RutaPasadaEtapa | null;
  setSelectedEtapaId: (id: number) => void;
  addSample: (pesoNeto: number) => Promise<Muestra | undefined>;
  updateSample: (index: number, data: { observacion: string | null }) => Promise<void>;
  removeSample: (index: number) => Promise<void>;
  clearSession: () => void;
  isRegistering: boolean;
}

export function useMuestrasLibres({
  lineaProduccionId,
  usuarioId,
  etapas,
  onApiError,
}: UseMuestrasLibresProps): UseMuestrasLibresResult {
  const [muestras, setMuestras] = useState<Muestra[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);

  // Ref mirror of muestras so callbacks can read the latest array WITHOUT
  // capturing `muestras` in their dependency arrays (stale closure / index
  // shift on rapid successive deletes). Updated on every render.
  const muestrasRef = useRef<Muestra[]>(muestras);
  const muestrasLengthRef = useRef(muestras.length);
  useLayoutEffect(() => {
    muestrasRef.current = muestras;
    muestrasLengthRef.current = muestras.length;
  });

  const defaultEtapaId = useMemo<number | null>(() => {
    if (!etapas || etapas.length === 0) return null;
    const sorted = [...etapas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    return sorted[0].etapa.id ?? null;
  }, [etapas]);

  const [selectedEtapaId, setSelectedEtapaId] = useState<number | null>(defaultEtapaId);

  // Derived etapa matching selectedEtapaId against etapas — mirrors the
  // etapaActiva pattern used by usePasadaState/TabletWorkspace, so the page
  // can read pesoMinimo/pesoIdeal/pesoMaximo for the currently selected etapa
  // without duplicating the lookup.
  const selectedEtapa = useMemo<RutaPasadaEtapa | null>(() => {
    if (selectedEtapaId === null) return null;
    return etapas.find((e) => e.etapa.id === selectedEtapaId) ?? null;
  }, [etapas, selectedEtapaId]);

  const addSample = useCallback(
    async (pesoNeto: number): Promise<Muestra | undefined> => {
      if (selectedEtapaId === null) return undefined;
      if (muestrasLengthRef.current >= MAX_FREE_SAMPLES) return undefined;

      setIsRegistering(true);
      try {
        const raw = await registrarMuestra({
          etapaId: selectedEtapaId,
          pesoNeto,
          usuarioId,
          lineaProduccionId,
        });
        const normalized = normalizeMuestra(raw);
        setMuestras((prev) => {
          if (prev.length >= MAX_FREE_SAMPLES) return prev;
          return [...prev, normalized];
        });
        return normalized;
      } catch (e) {
        if (onApiError) onApiError(e);
        return undefined;
      } finally {
        setIsRegistering(false);
      }
    },
    [selectedEtapaId, usuarioId, lineaProduccionId, onApiError]
  );

  const removeSample = useCallback(
    async (index: number): Promise<void> => {
      const sample = muestrasRef.current[index];
      if (!sample) return;

      if (sample.id !== undefined) {
        await deleteMuestra(sample.id);
      }
      setMuestras((prev) => prev.filter((_, i) => i !== index));
    },
    []
  );

  const updateSample = useCallback(
    async (index: number, data: { observacion: string | null }): Promise<void> => {
      const sample = muestrasRef.current[index];
      if (!sample || sample.id === undefined) return;

      try {
        const updated = await updateMuestra(sample.id, data);
        const normalized = normalizeMuestra(updated);
        setMuestras((prev) => prev.map((m, i) => (i === index ? normalized : m)));
      } catch (e) {
        if (onApiError) onApiError(e);
        throw e;
      }
    },
    [onApiError]
  );

  const clearSession = useCallback(() => {
    setMuestras([]);
  }, []);

  return {
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
  };
}
