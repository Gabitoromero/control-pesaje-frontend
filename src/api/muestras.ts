import api from './axios';
import type { Muestra } from '../shared/types/index';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const registrarMuestra = async (data: {
  pasadaId?: number;
  etapaId: number;
  pesoNeto: number;
  usuarioId: number;
  lineaProduccionId: number;
  articuloId?: number;
}): Promise<Muestra> => {
  const response = await api.post<ApiEnvelope<Muestra>>('/muestras', data);
  return response.data.data;
};

export const deleteMuestra = async (id: number): Promise<void> => {
  await api.delete(`/muestras/${id}`);
};

export const getMuestras = async (pasadaId: number): Promise<Muestra[]> => {
  const response = await api.get<ApiEnvelope<Muestra[]>>('/muestras', { params: { pasadaId } });
  return response.data.data;
};

export const updateMuestra = async (
  id: number,
  data: { observacion: string | null }
): Promise<Muestra> => {
  const response = await api.put<ApiEnvelope<Muestra>>(`/muestras/${id}`, data);
  return response.data.data;
};
