import api from './axios';
import type { Ruta } from './rutas';

export interface Linea {
  id?: number;
  nombre: string;
  numeroBalanza: number;
  rutaPasadaActiva?: Ruta | null;
  activo?: boolean;
}

export interface LineaCreate extends Omit<Linea, 'id' | 'rutaPasadaActiva'> {
  rutaPasadaActiva?: number | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const getLineas = async (): Promise<Linea[]> => {
  const response = await api.get<ApiEnvelope<Linea[]>>('/lineas-produccion');
  return response.data.data;
};

export const getLineasInactivas = async (): Promise<Linea[]> => {
  const response = await api.get<ApiEnvelope<Linea[]>>('/lineas-produccion/inactive');
  return response.data.data;
};

export const getLinea = async (id: number): Promise<Linea> => {
  const response = await api.get<ApiEnvelope<Linea>>(`/lineas-produccion/${id}`);
  return response.data.data;
};

export const createLinea = async (linea: LineaCreate): Promise<Linea> => {
  const response = await api.post<ApiEnvelope<Linea>>('/lineas-produccion', linea);
  return response.data.data;
};

export const updateLinea = async (id: number, linea: Partial<LineaCreate>): Promise<Linea> => {
  const response = await api.put<ApiEnvelope<Linea>>(`/lineas-produccion/${id}`, linea);
  return response.data.data;
};

export const deleteLinea = async (id: number): Promise<void> => {
  await api.delete(`/lineas-produccion/${id}`);
};
