import api from './axios';

export interface Articulo {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export const getArticulos = async (): Promise<Articulo[]> => {
  const response = await api.get<Articulo[]>('/articulos');
  return response.data;
};

export const getArticulo = async (id: number): Promise<Articulo> => {
  const response = await api.get<Articulo>(`/articulos/${id}`);
  return response.data;
};

export const createArticulo = async (articulo: Omit<Articulo, 'id'>): Promise<Articulo> => {
  const response = await api.post<Articulo>('/articulos', articulo);
  return response.data;
};

export const updateArticulo = async (id: number, articulo: Partial<Articulo>): Promise<Articulo> => {
  const response = await api.put<Articulo>(`/articulos/${id}`, articulo);
  return response.data;
};

export const deleteArticulo = async (id: number): Promise<void> => {
  await api.delete(`/articulos/${id}`);
};
