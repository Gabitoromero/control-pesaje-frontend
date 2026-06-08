import api from './axios';

export interface Articulo {
  id?: number;
  codigo: string;
  marca: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const getArticulos = async (): Promise<Articulo[]> => {
  const response = await api.get<ApiEnvelope<Articulo[]>>('/articulos');
  return response.data.data;
};

export const getArticulosInactivos = async (): Promise<Articulo[]> => {
  const response = await api.get<ApiEnvelope<Articulo[]>>('/articulos/inactive');
  return response.data.data;
};

export const getArticulo = async (id: number): Promise<Articulo> => {
  const response = await api.get<ApiEnvelope<Articulo>>(`/articulos/${id}`);
  return response.data.data;
};

export const createArticulo = async (articulo: Omit<Articulo, 'id'>): Promise<Articulo> => {
  const response = await api.post<ApiEnvelope<Articulo>>('/articulos', articulo);
  return response.data.data;
};

export const updateArticulo = async (id: number, articulo: Partial<Articulo>): Promise<Articulo> => {
  const response = await api.put<ApiEnvelope<Articulo>>(`/articulos/${id}`, articulo);
  return response.data.data;
};

export const deleteArticulo = async (id: number): Promise<void> => {
  await api.delete(`/articulos/${id}`);
};
