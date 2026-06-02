import { useState, useCallback } from 'react';
import type { Muestra, RutaPasadaEtapa, EstadoValidacion } from '../../../shared/types/domain';

interface UsePasadaStateProps {
  usuarioId: number;
  lineaProduccionId: number;
  etapaActiva: RutaPasadaEtapa | null;
  articuloId?: number;
}

export function usePasadaState({
  usuarioId,
  lineaProduccionId,
  etapaActiva,
  articuloId,
}: UsePasadaStateProps) {
  const [muestras, setMuestras] = useState<Muestra[]>([]);

  const calcularEstadoValidacion = (peso: number): EstadoValidacion => {
    if (!etapaActiva) return 'fuera_de_rango';
    if (peso >= etapaActiva.peso_minimo && peso <= etapaActiva.peso_maximo) {
      return 'ok';
    }
    return 'fuera_de_rango';
  };

  const addSample = useCallback((pesoNeto: number) => {
    if (!etapaActiva) return;
    
    setMuestras((prev) => {
      if (prev.length >= 50) return prev; // Límite de 50 muestras por pasada (local buffer)

      const nuevaMuestra: Muestra = {
        peso_neto: pesoNeto,
        estado_validacion: calcularEstadoValidacion(pesoNeto),
        usuario_id: usuarioId,
        etapa_id: etapaActiva.etapa_id,
        linea_produccion_id: lineaProduccionId,
        articulo_id: articuloId,
        timestamp: new Date(),
      };
      
      return [...prev, nuevaMuestra];
    });
  }, [etapaActiva, usuarioId, lineaProduccionId, articuloId]);

  const removeSample = useCallback((index: number) => {
    setMuestras((prev) => {
      const newMuestras = [...prev];
      // Descartado local (removemos en vez de marcar como descartado para evitar enviar basura, o lo marcamos como descartado)
      // La regla pide "local discard", que removería la muestra del buffer.
      newMuestras.splice(index, 1);
      return newMuestras;
    });
  }, []);

  const clearPasada = useCallback(() => {
    setMuestras([]);
  }, []);

  return {
    muestras,
    addSample,
    removeSample,
    clearPasada,
  };
}
