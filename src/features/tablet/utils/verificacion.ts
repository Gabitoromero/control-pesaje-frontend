import type { Pasada } from '../../../shared/types/domain';

// Mirrors the backend: a verification pasada (standard weights) is one whose articulo has code "0".
export const CODIGO_ARTICULO_VERIFICACION = '0';

export const esPasadaDeVerificacion = (pasada: Pick<Pasada, 'articulo'>): boolean =>
  pasada.articulo?.codigo === CODIGO_ARTICULO_VERIFICACION;
