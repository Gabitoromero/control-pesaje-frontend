import api from './axios';
import { fetchPage, type Page, type PageQuery } from './pagination';
import type { UsuarioRol, UsuarioMetadata } from '../shared/types';

export type UsuarioDatosAdicionales = UsuarioMetadata;

export interface Usuario {
  id?: number;
  nombreApellido: string;
  nombreUsuario: string;
  legajo: string;
  rol: UsuarioRol;
  activo?: boolean;
  puedeTomarMuestrasLibres?: boolean;
  pin?: string;
  datosAdicionales?: UsuarioDatosAdicionales;
}

export type UsuarioCreate = Omit<Usuario, 'id'>;

export interface UsuarioPageQuery extends PageQuery {
  /** A sector code (OF, SU, DD, MC) or `sin-sector`. */
  sector?: string;
}

export const getUsuarios = (query?: UsuarioPageQuery): Promise<Page<Usuario>> =>
  fetchPage<Usuario>('/usuarios', query);

export const getUsuariosInactivos = (query?: UsuarioPageQuery): Promise<Page<Usuario>> =>
  fetchPage<Usuario>('/usuarios/inactive', query);

export const getUsuario = async (id: number): Promise<Usuario> => {
  const response = await api.get<{ success: boolean; data: Usuario }>(`/usuarios/${id}`);
  return response.data.data;
};

export const createUsuario = async (usuario: UsuarioCreate): Promise<Usuario> => {
  const response = await api.post<{ success: boolean; data: Usuario }>('/usuarios', usuario);
  return response.data.data;
};

export const updateUsuario = async (id: number, usuario: Partial<UsuarioCreate>): Promise<Usuario> => {
  const response = await api.put<{ success: boolean; data: Usuario }>(`/usuarios/${id}`, usuario);
  return response.data.data;
};

export const deleteUsuario = async (id: number): Promise<void> => {
  await api.delete(`/usuarios/${id}`);
};
