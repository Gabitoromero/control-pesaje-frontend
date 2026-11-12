import api from './axios';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export type HistorialRaizTipo = 'articulo' | 'ruta' | 'etapa' | 'linea';
export type HistorialAccion = 'crear' | 'editar' | 'desactivar' | 'eliminar';

export interface HistorialCambioItem {
  id: number;
  entidad: string;
  entidadId: number;
  raizTipo: HistorialRaizTipo;
  raizId: number;
  accion: HistorialAccion;
  fecha: string;
  antes: Record<string, unknown>;
  despues: Record<string, unknown>;
  /** Name of the etapa/articulo a nested ruta change refers to. */
  contexto?: string;
  usuario: { id: number; nombreApellido: string; nombreUsuario: string; sector?: string | null } | null;
}

/** Current human name of referenced ids: { field: { id: label } }. */
export type HistorialReferencias = Record<string, Record<string, string>>;

export interface HistorialCambiosResponse {
  items: HistorialCambioItem[];
  referencias?: HistorialReferencias;
  total: number;
  page: number;
  pageSize: number;
}

export interface HistorialCambiosParams {
  raizTipo: HistorialRaizTipo;
  raizId: number;
  usuarioId?: number;
  desde?: string;
  hasta?: string;
  page?: number;
  pageSize?: number;
}

/** Change history of a root record (jefe/administrador only). */
export const getHistorialCambios = async (params: HistorialCambiosParams): Promise<HistorialCambiosResponse> => {
  const response = await api.get<ApiEnvelope<HistorialCambiosResponse>>('/historial-cambios', { params });
  return response.data.data;
};
