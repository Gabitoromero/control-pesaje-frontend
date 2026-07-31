import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';
import { registrarMuestra, deleteMuestra, updateMuestra } from '../../../api/muestras';
import { normalizeMuestra } from '../utils/muestra.utils';
import { deriveEtapasConEstado } from '../utils/stageProgress';
// Re-exported for back-compat with existing consumers importing these types
// from this module (e.g. StageProgressPanel). The single source of truth
// for both the type shapes and the derivation logic is `stageProgress.ts`.
export type { EstadoEtapa, EtapaConEstado } from '../utils/stageProgress';

interface UsePasadaStateProps {
  pasadaId: number | undefined;
  usuarioId: number;
  lineaProduccionId: number;
  etapas: RutaPasadaEtapa[];
  initialMuestras?: Muestra[];
  onApiError?: (error: unknown) => void;
}


export function usePasadaState({
  pasadaId,
  usuarioId,
  lineaProduccionId,
  etapas,
  initialMuestras,
  onApiError,
}: UsePasadaStateProps) {
  const [muestras, setMuestras] = useState<Muestra[]>([]);

  const initialMuestrasKey = initialMuestras
    ? initialMuestras.map((m, idx) => m.id ?? idx).join(',')
    : '';

  useEffect(() => {
    if (initialMuestras) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMuestras(initialMuestras.map(normalizeMuestra));
    } else {
      setMuestras([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMuestrasKey, pasadaId]);



  // etapasConEstado/etapaActiva are pure functions of (etapas, muestras) —
  // no independent client-side pointer is kept. Every recompute (e.g. after
  // a delete-driven refetch reseeds `muestras`) re-derives from the current
  // OK-sample counts, so regression to an earlier stage happens naturally.
  const etapasConEstado = useMemo(
    () => deriveEtapasConEstado(etapas ?? [], muestras),
    [etapas, muestras]
  );

  const etapaActiva = etapasConEstado.find((e) => e.estado === 'actual')?.etapa ?? null;

  const addSample = useCallback(async (pesoNeto: number) => {
    if (!pasadaId) {
      console.warn('Cannot add sample: pasadaId is undefined');
      return;
    }
    if (!etapaActiva) {
      console.warn('Cannot add sample: no active stage');
      return;
    }

    const stageId = etapaActiva.etapa.id;
    if (stageId === undefined) {
      console.warn('Cannot add sample: stageId is undefined');
      return;
    }

    try {

      const data = {
        pasadaId,
        etapaId: stageId,
        pesoNeto,
        usuarioId,
        lineaProduccionId,
      };

      const nuevaMuestra = await registrarMuestra(data);
      const normalized = normalizeMuestra(nuevaMuestra);

      setMuestras((prev) => {
        if (prev.length >= 50) return prev;
        return [...prev, normalized];
      });
      return normalized;
    } catch (error) {
      console.error('Error registering sample:', error);
      if (onApiError) {
        onApiError(error);
      }
      throw error;
    }
  }, [pasadaId, etapaActiva, usuarioId, lineaProduccionId, onApiError]);

  const updateSample = useCallback(async (index: number, data: { observacion: string | null }) => {
    const sampleToUpdate = muestras[index];
    if (!sampleToUpdate) {
      console.warn('No sample found at index:', index);
      return;
    }

    const sampleId = sampleToUpdate.id;
    if (sampleId === undefined) {
      console.warn('Cannot update sample: sample has no id');
      return;
    }

    try {
      const updated = await updateMuestra(sampleId, data);
      const normalized = normalizeMuestra(updated);
      setMuestras((prev) => prev.map((m, i) => (i === index ? normalized : m)));
    } catch (error) {
      console.error('Error updating sample:', error);
      if (onApiError) {
        onApiError(error);
      }
      throw error;
    }
  }, [muestras, onApiError]);

  const removeSample = useCallback(async (index: number) => {
    const sampleToRemove = muestras[index];
    if (!sampleToRemove) {
      console.warn('No sample found at index:', index);
      return;
    }

    const sampleId = sampleToRemove.id;
    if (sampleId === undefined) {
      setMuestras((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    // Refetch-driven, not optimistic: only call the API here. The caller
    // (TabletWorkspace) invalidates the muestras query on success; the
    // subsequent refetch reseeds `initialMuestras`, which recomputes
    // `muestras` and, transitively, `etapasConEstado`/`etapaActiva`.
    try {
      await deleteMuestra(sampleId);
    } catch (error) {
      console.error('Error deleting sample:', error);
      if (onApiError) {
        onApiError(error);
      }
      throw error;
    }
  }, [muestras, onApiError]);

  const clearPasada = useCallback(() => {
    setMuestras([]);
  }, []);

  return {
    muestras,
    etapaActiva,
    etapasConEstado,
    addSample,
    updateSample,
    removeSample,
    clearPasada,
  };
}

