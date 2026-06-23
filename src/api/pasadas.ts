import api from './axios';
import type { Pasada } from '../shared/types';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const getPasadas = async (params: { estado?: string; lineaProduccionId?: number; linea_id?: number }): Promise<Pasada[]> => {
  const queryParams: Record<string, any> = {};
  if (params.estado !== undefined) queryParams.estado = params.estado;
  if (params.lineaProduccionId !== undefined) {
    queryParams.lineaProduccionId = params.lineaProduccionId;
  } else if (params.linea_id !== undefined) {
    queryParams.lineaProduccionId = params.linea_id;
  }
  const response = await api.get<ApiEnvelope<Pasada[]>>('/pasadas', { params: queryParams });
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
