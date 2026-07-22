import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';
import { registrarMuestra, deleteMuestra, updateMuestra } from '../../../api/muestras';
import { normalizeMuestra } from '../utils/muestra.utils';

export type EstadoEtapa = 'completada' | 'actual' | 'pendiente';

export interface EtapaConEstado {
  etapa: RutaPasadaEtapa;
  estado: EstadoEtapa;
  muestrasOk: number;
  muestrasRequeridas: number;
}

interface UsePasadaStateProps {
  pasadaId: number | undefined;
  usuarioId: number;
  lineaProduccionId: number;
  articuloId?: number;
  etapas: RutaPasadaEtapa[];
  initialMuestras?: Muestra[];
  onApiError?: (error: unknown) => void;
}


export function usePasadaState({
  pasadaId,
  usuarioId,
  lineaProduccionId,
  articuloId,
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



  const [completedEtapaIds, setCompletedEtapaIds] = useState<number[]>(() => {
    if (!pasadaId) return [];
    try {
      const saved = localStorage.getItem(`pasada_${pasadaId}_completed`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reset completedEtapaIds when pasadaId changes — useState initializer
  // only runs on mount, so without this a new pasada inherits the previous
  // one's completed stages, pushing the active stage forward incorrectly.
  useEffect(() => {
    if (!pasadaId) {
      setCompletedEtapaIds([]);
      return;
    }
    try {
      const saved = localStorage.getItem(`pasada_${pasadaId}_completed`);
      setCompletedEtapaIds(saved ? JSON.parse(saved) : []);
    } catch {
      setCompletedEtapaIds([]);
    }
  }, [pasadaId]);

  const finalizarEtapaActual = useCallback(() => {
    setCompletedEtapaIds((prev) => {
      // Find the current active stage
      if (!etapas || etapas.length === 0) return prev;
      const sortedEtapas = [...etapas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      let activeStageId: number | undefined;
      for (const wrapper of sortedEtapas) {
        if (!prev.includes(wrapper.etapa.id!)) {
          activeStageId = wrapper.etapa.id;
          break;
        }
      }
      
      if (activeStageId !== undefined && !prev.includes(activeStageId)) {
        const next = [...prev, activeStageId];
        localStorage.setItem(`pasada_${pasadaId}_completed`, JSON.stringify(next));
        return next;
      }
      return prev;
    });
  }, [etapas, pasadaId]);

  const etapasConEstado = useMemo(() => {
    if (!etapas || etapas.length === 0) return [];
    
    const sortedEtapas = [...etapas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    
    let isActualFound = false;
    
    return sortedEtapas.map((etapaWrapper): EtapaConEstado => {
      const stageId = etapaWrapper.etapa.id;
      const muestrasRequeridas = etapaWrapper.cantidadMuestrasRequeridas;
      
      const muestrasOk = muestras.filter((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mEtapaId = m.etapaId ?? (m as any).etapa_id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mEstado = m.estadoValidacion ?? (m as any).estado_validacion;
        return mEtapaId === stageId && mEstado === 'ok';
      }).length;
      
      const isMarcadaComoCompleta = stageId !== undefined && completedEtapaIds.includes(stageId);
      let estado: EstadoEtapa;
      
      if (isMarcadaComoCompleta) {
        estado = 'completada';
      } else if (!isActualFound) {
        estado = 'actual';
        isActualFound = true;
      } else {
        estado = 'pendiente';
      }
      
      return {
        etapa: etapaWrapper,
        estado,
        muestrasOk,
        muestrasRequeridas,
      };
    });
  }, [etapas, muestras, completedEtapaIds]);

  const etapaActiva = etapasConEstado.find(e => e.estado === 'actual')?.etapa ?? null;

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
        articuloId,
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
  }, [pasadaId, etapaActiva, usuarioId, lineaProduccionId, articuloId, onApiError]);

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

    try {
      await deleteMuestra(sampleId);
      setMuestras((prev) => prev.filter((_, i) => i !== index));
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
    setCompletedEtapaIds([]);
    if (pasadaId) {
      localStorage.removeItem(`pasada_${pasadaId}_completed`);
    }
  }, [pasadaId]);

  return {
    muestras,
    etapaActiva,
    etapasConEstado,
    addSample,
    updateSample,
    removeSample,
    clearPasada,
    finalizarEtapaActual,
  };
}

