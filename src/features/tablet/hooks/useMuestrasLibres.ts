import { useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import type { Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';
import { registrarMuestra, deleteMuestra } from '../../../api/muestras';
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
  setSelectedEtapaId: (id: number) => void;
  addSample: (pesoNeto: number) => Promise<Muestra | undefined>;
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

  const clearSession = useCallback(() => {
    setMuestras([]);
  }, []);

  return {
    muestras,
    etapas,
    selectedEtapaId,
    setSelectedEtapaId,
    addSample,
    removeSample,
    clearSession,
    isRegistering,
  };
}
