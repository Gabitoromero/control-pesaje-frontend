import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';
import { registrarMuestra, deleteMuestra } from '../../../api/muestras';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMuestras(initialMuestras.map(normalizeMuestra));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMuestras([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMuestrasKey, pasadaId]);



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
      
      const completa = muestrasOk >= muestrasRequeridas;
      let estado: EstadoEtapa;
      
      if (completa) {
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
  }, [etapas, muestras]);

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
    etapasConEstado,
    addSample,
    removeSample,
    clearPasada,
  };
}

