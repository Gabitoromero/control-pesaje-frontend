import api from './axios';
import { fetchPage, type Page, type PageQuery } from './pagination';

export interface Etapa {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export type EtapaCreate = Omit<Etapa, 'id'>;

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const getEtapas = (query?: PageQuery): Promise<Page<Etapa>> =>
  fetchPage<Etapa>('/etapas', query);

export const getEtapasInactivas = (query?: PageQuery): Promise<Page<Etapa>> =>
  fetchPage<Etapa>('/etapas/inactive', query);

export const getEtapa = async (id: number): Promise<Etapa> => {
  const response = await api.get<ApiEnvelope<Etapa>>(`/etapas/${id}`);
  return response.data.data;
};

export const createEtapa = async (etapa: EtapaCreate): Promise<Etapa> => {
  const response = await api.post<ApiEnvelope<Etapa>>('/etapas', etapa);
  return response.data.data;
};

export const updateEtapa = async (id: number, etapa: Partial<Etapa>): Promise<Etapa> => {
  const response = await api.put<ApiEnvelope<Etapa>>(`/etapas/${id}`, etapa);
  return response.data.data;
};

export const deleteEtapa = async (id: number): Promise<void> => {
  await api.delete(`/etapas/${id}`);
};
