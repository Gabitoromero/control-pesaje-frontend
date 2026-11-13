import type { AtributoEtapa, Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';

export interface CualidadesPendientes {
  etapa: RutaPasadaEtapa;
  atributos: AtributoEtapa[];
}

const ESTADOS_QUE_AVANZAN: ReadonlyArray<Muestra['estadoValidacion']> = ['ok', 'fuera_de_rango'];

/**
 * The etapa whose cualidades the operator must load now, or null.
 *
 * Walks the etapas by `orden`: the first one that already has all its required samples and still has active
 * cualidades without a loaded value is the pending one. An etapa that still lacks samples ends the walk (its
 * cualidades are asked when its samples are done), and an etapa that requires no samples never asks for them.
 * Mirrors the backend rule that blocks the next stage while cualidades are pending.
 */
export function deriveCualidadesPendientes(
  etapas: RutaPasadaEtapa[],
  muestras: Muestra[],
  atributoIdsCargados: ReadonlySet<number>,
): CualidadesPendientes | null {
  const ordenadas = [...etapas].sort((a, b) => a.orden - b.orden);

  for (const etapa of ordenadas) {
    const requeridas = etapa.cantidadMuestrasRequeridas;
    const registradas = muestras.filter(
      (m) => m.etapaId === etapa.etapa.id && ESTADOS_QUE_AVANZAN.includes(m.estadoValidacion),
    ).length;
    if (registradas < requeridas) return null;
    if (requeridas <= 0) continue;

    const pendientes = (etapa.atributos ?? []).filter((a) => !atributoIdsCargados.has(a.id));
    if (pendientes.length > 0) return { etapa, atributos: pendientes };
  }
  return null;
}
