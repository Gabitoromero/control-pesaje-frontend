import api from './axios';

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

export const getEtapas = async (): Promise<Etapa[]> => {
  const response = await api.get<ApiEnvelope<Etapa[]>>('/etapas');
  return response.data.data;
};

export const getEtapasInactivas = async (): Promise<Etapa[]> => {
  const response = await api.get<ApiEnvelope<Etapa[]>>('/etapas/inactive');
  return response.data.data;
};

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
