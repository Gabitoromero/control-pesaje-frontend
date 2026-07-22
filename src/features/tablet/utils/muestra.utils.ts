import type { Muestra } from '../../../shared/types/domain';

/**
 * Normalizes a raw API response (which may use camelCase or snake_case) into
 * a canonical Muestra domain object. Handles both flat IDs and populated
 * relation objects for `usuario` and `etapa`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeMuestra = (m: any): Muestra => {
  const pesoNeto = m.pesoNeto ?? m.peso_neto ?? 0;
  const estadoValidacion = m.estadoValidacion ?? m.estado_validacion ?? 'fuera_de_rango';
  const usuarioId =
    m.usuarioId ??
    m.usuario_id ??
    (typeof m.usuario === 'object' && m.usuario !== null
      ? m.usuario.id
      : typeof m.usuario === 'number'
        ? m.usuario
        : 0);
  const etapaId =
    m.etapaId ??
    m.etapa_id ??
    (typeof m.etapa === 'object' && m.etapa !== null
      ? m.etapa.id
      : typeof m.etapa === 'number'
        ? m.etapa
        : 0);
  const lineaProduccionId = m.lineaProduccionId ?? m.linea_produccion_id ?? 0;
  const timestamp = m.timestamp ?? new Date();

  return {
    ...m,
    id: m.id,
    pesoNeto,
    estadoValidacion,
    usuarioId,
    etapaId,
    lineaProduccionId,
    peso_neto: pesoNeto,
    estado_validacion: estadoValidacion,
    usuario_id: usuarioId,
    etapa_id: etapaId,
    linea_produccion_id: lineaProduccionId,
    timestamp,
  };
};
