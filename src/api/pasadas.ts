import api from './axios';
import type { Pasada } from '../shared/types';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const getPasadas = async (params: { estado?: string; linea_id?: number }): Promise<Pasada[]> => {
  const response = await api.get<ApiEnvelope<Pasada[]>>('/pasadas', { params });
  return response.data.data;
};

export const getPasada = async (id: number): Promise<Pasada> => {
  const response = await api.get<ApiEnvelope<Pasada>>(`/pasadas/${id}`);
  return response.data.data;
};

export const iniciarPasada = async (data: { lineaProduccionId: number; articuloId: number }): Promise<Pasada> => {
  const response = await api.post<ApiEnvelope<Pasada>>('/pasadas', data);
  return response.data.data;
};

export const completarPasada = async (id: number): Promise<Pasada> => {
  const response = await api.put<ApiEnvelope<Pasada>>(`/pasadas/${id}`, { action: 'completar' });
  return response.data.data;
};
