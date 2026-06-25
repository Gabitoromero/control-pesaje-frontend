import { useState, useCallback, useEffect } from 'react';
import type { Muestra, EstadoValidacion, RutaPasadaEtapa } from '../../../shared/types/domain';
import { registrarMuestra, deleteMuestra } from '../../../api/muestras';

interface UsePasadaStateProps {
  pasadaId: number | undefined;
  usuarioId: number;
  lineaProduccionId: number;
  articuloId?: number;
  etapas: RutaPasadaEtapa[];
  initialMuestras?: Muestra[];
  onApiError?: (error: unknown) => void;
}

const normalizeMuestra = (m: any): Muestra => {
  const pesoNeto = m.pesoNeto ?? m.peso_neto ?? 0;
  const estadoValidacion = m.estadoValidacion ?? m.estado_validacion ?? 'fuera_de_rango';
  const usuarioId = m.usuarioId ?? m.usuario_id ?? 0;
  const etapaId = m.etapaId ?? m.etapa_id ?? 0;
  const lineaProduccionId = m.lineaProduccionId ?? m.linea_produccion_id ?? 0;
  const articuloId = m.articuloId ?? m.articulo_id;
  const timestamp = m.timestamp ?? new Date();

  return {
    ...m,
    id: m.id,
    pesoNeto,
    estadoValidacion,
    usuarioId,
    etapaId,
    lineaProduccionId,
    articuloId,
    peso_neto: pesoNeto,
    estado_validacion: estadoValidacion,
    usuario_id: usuarioId,
    etapa_id: etapaId,
    linea_produccion_id: lineaProduccionId,
    articulo_id: articuloId,
    timestamp,
  };
};

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
      setMuestras(initialMuestras.map(normalizeMuestra));
    } else {
      setMuestras([]);
    }
  }, [initialMuestrasKey, pasadaId]);

  const calcularEstadoValidacion = (peso: number, etapa: RutaPasadaEtapa): EstadoValidacion => {
    if (peso >= etapa.pesoMinimo && peso <= etapa.pesoMaximo) {
      return 'ok';
    }
    return 'fuera_de_rango';
  };

  // Task 3.2: Derived client-side stage calculation
  const obtenerEtapaActiva = useCallback((): RutaPasadaEtapa | null => {
    if (!etapas || etapas.length === 0) return null;
    const sortedEtapas = [...etapas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    
    for (const stage of sortedEtapas) {
      const stageId = stage.etapa.id;
      if (stageId === undefined) continue;
      
      const reqCount = stage.cantidadMuestrasRequeridas;
      
      const muestrasEtapa = muestras.filter((m) => {
        const mEtapaId = m.etapaId ?? m.etapa_id;
        const mEstado = m.estadoValidacion ?? m.estado_validacion;
        return mEtapaId === stageId && mEstado !== 'descartado';
      });

      if (muestrasEtapa.length < reqCount) {
        return stage;
      }
    }
    return null;
  }, [etapas, muestras]);

  const etapaActiva = obtenerEtapaActiva();

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
      const validacion = calcularEstadoValidacion(pesoNeto, etapaActiva);
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
  }, []);

  return {
    muestras,
    etapaActiva,
    addSample,
    removeSample,
    clearPasada,
  };
}

