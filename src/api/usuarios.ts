import api from './axios';
import type { UsuarioRol } from '../shared/types';

export interface Usuario {
  id?: number;
  nombreApellido: string;
  nombreUsuario: string;
  legajo: string;
  rol: UsuarioRol;
  activo?: boolean;
  puedeTomarMuestrasLibres?: boolean;
  pin?: string;
}

export interface UsuarioCreate extends Omit<Usuario, 'id'> {
  contrasena?: string;
}

export const getUsuarios = async (): Promise<Usuario[]> => {
  const response = await api.get<{ success: boolean; data: Usuario[] }>('/usuarios');
  return response.data.data;
};

export const getUsuariosInactivos = async (): Promise<Usuario[]> => {
  const response = await api.get<{ success: boolean; data: Usuario[] }>('/usuarios/inactive');
  return response.data.data;
};

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
