import api from './axios';

export interface Ruta {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface RutaCreate extends Omit<Ruta, 'id'> {}

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

export const updateRuta = async (id: number, ruta: Partial<Ruta>): Promise<Ruta> => {
  const response = await api.put<ApiEnvelope<Ruta>>(`/rutas-pasadas/${id}`, ruta);
  return response.data.data;
};

export const deleteRuta = async (id: number): Promise<void> => {
  await api.delete(`/rutas-pasadas/${id}`);
};
