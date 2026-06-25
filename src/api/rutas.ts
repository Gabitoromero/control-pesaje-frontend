import api from './axios';
import type { Ruta, RutaCreate, RutaUpdate } from '../shared/types/domain';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const getRutas = async (): Promise<Ruta[]> => {
  const response = await api.get<ApiEnvelope<Ruta[]>>('/rutas-pasadas');
  return response.data.data;
};

export const getRutasInactivas = async (): Promise<Ruta[]> => {
  const response = await api.get<ApiEnvelope<Ruta[]>>('/rutas-pasadas/inactive');
  return response.data.data;
};

export const getRuta = async (id: number): Promise<Ruta> => {
  const response = await api.get<ApiEnvelope<Ruta>>(`/rutas-pasadas/${id}`);
  return response.data.data;
};

export const createRuta = async (ruta: RutaCreate): Promise<Ruta> => {
  const response = await api.post<ApiEnvelope<Ruta>>('/rutas-pasadas', ruta);
  return response.data.data;
};

export const updateRuta = async (id: number, ruta: RutaUpdate): Promise<Ruta> => {
  const response = await api.put<ApiEnvelope<Ruta>>(`/rutas-pasadas/${id}`, ruta);
  return response.data.data;
};

export const deleteRuta = async (id: number): Promise<void> => {
  await api.delete(`/rutas-pasadas/${id}`);
};
