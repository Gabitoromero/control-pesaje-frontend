import api from './axios';
import { fetchPage, type Page, type PageQuery } from './pagination';

export interface Articulo {
  id?: number;
  codigo: string;
  nombre?: string;
  descripcion?: string | null;
  activo?: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const getArticulos = (query?: PageQuery): Promise<Page<Articulo>> =>
  fetchPage<Articulo>('/articulos', query);

export const getArticulosInactivos = (query?: PageQuery): Promise<Page<Articulo>> =>
  fetchPage<Articulo>('/articulos/inactive', query);

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
