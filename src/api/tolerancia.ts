import api from './axios';

export interface ToleranciaConfig {
  toleranciaPct: number;
  updatedAt: string;
  updatedBy: { id: number; nombreUsuario: string; nombreApellido: string } | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const getToleranciaConfig = async (): Promise<ToleranciaConfig> => {
  const response = await api.get<ApiEnvelope<ToleranciaConfig>>('/configuracion/tolerancia');
  return response.data.data;
};

export const updateToleranciaConfig = async (toleranciaPct: number): Promise<ToleranciaConfig> => {
  const response = await api.put<ApiEnvelope<ToleranciaConfig>>('/configuracion/tolerancia', {
    toleranciaPct,
  });
  return response.data.data;
};
