import api from './axios';

export interface Ruta {
  id?: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface RutaCreate extends Omit<Ruta, 'id'> {}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const getRutas = async (): Promise<Ruta[]> => {
  const response = await api.get<ApiEnvelope<Ruta[]>>('/rutas-pasadas-etapas');
  return response.data.data;
};

export const getRuta = async (id: number): Promise<Ruta> => {
  const response = await api.get<ApiEnvelope<Ruta>>(`/rutas-pasadas-etapas/${id}`);
  return response.data.data;
};

export const createRuta = async (ruta: RutaCreate): Promise<Ruta> => {
  const response = await api.post<ApiEnvelope<Ruta>>('/rutas-pasadas-etapas', ruta);
  return response.data.data;
};

export const updateRuta = async (id: number, ruta: Partial<Ruta>): Promise<Ruta> => {
  const response = await api.put<ApiEnvelope<Ruta>>(`/rutas-pasadas-etapas/${id}`, ruta);
  return response.data.data;
};

export const deleteRuta = async (id: number): Promise<void> => {
  await api.delete(`/rutas-pasadas-etapas/${id}`);
};
