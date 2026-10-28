import api from './axios';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface HistorialItem {
  id: number;
  timestamp: string;
  pesoNeto: number;
  pesoIdeal: number;
  pesoMinimo: number;
  pesoMaximo: number;
  estadoValidacion: 'ok' | 'fuera_de_rango';
  observacion: string | null;
  pasadaId: number | null;
  etapa: { id: number; nombre: string };
  rutaPasada: { id: number; nombre: string };
  articulo: { id: number; codigo: string; nombre: string | null } | null;
}

export interface HistorialKpis {
  total: number;
  ok: number;
  fueraRango: number;
  porcentajeOk: number;
  porcentajeFueraRango: number;
}

export interface HistorialResponse {
  items: HistorialItem[];
  total: number;
  page: number;
  pageSize: number;
  kpis: HistorialKpis;
}

export interface HistorialParams {
  desde?: string;
  hasta?: string;
  etapaId?: number;
  articuloId?: number;
  q?: string;
  page?: number;
  pageSize?: number;
}

/** History of the authenticated user's own muestras (the user comes from the token). */
export const getHistorial = async (params: HistorialParams = {}): Promise<HistorialResponse> => {
  const response = await api.get<ApiEnvelope<HistorialResponse>>('/muestras/historial', { params });
  return response.data.data;
};
