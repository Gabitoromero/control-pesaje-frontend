import api from './axios';
import type { Balanza } from '../shared/types/domain';

export type BalanzaCreate = Omit<Balanza, 'id'>;

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const getBalanzas = async (): Promise<Balanza[]> => {
  const response = await api.get<ApiEnvelope<Balanza[]>>('/balanzas');
  return response.data.data;
};

export const getBalanzasInactivas = async (): Promise<Balanza[]> => {
  const response = await api.get<ApiEnvelope<Balanza[]>>('/balanzas/inactive');
  return response.data.data;
};

export const getBalanza = async (id: number): Promise<Balanza> => {
  const response = await api.get<ApiEnvelope<Balanza>>(`/balanzas/${id}`);
  return response.data.data;
};

export const createBalanza = async (balanza: BalanzaCreate): Promise<Balanza> => {
  const response = await api.post<ApiEnvelope<Balanza>>('/balanzas', balanza);
  return response.data.data;
};

export const updateBalanza = async (id: number, balanza: Partial<BalanzaCreate>): Promise<Balanza> => {
  const response = await api.put<ApiEnvelope<Balanza>>(`/balanzas/${id}`, balanza);
  return response.data.data;
};

export const deleteBalanza = async (id: number): Promise<void> => {
  await api.delete(`/balanzas/${id}`);
};
