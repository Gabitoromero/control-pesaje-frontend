import api from './axios';

export interface EtapaDetalle {
  id: number;
  nombre: string;
}

export interface RutaPasadaEtapa {
  id?: number;
  etapa: EtapaDetalle;
  orden: number;
  pesoMinimo: number;
  pesoIdeal: number;
  pesoMaximo: number;
  cantidadMuestrasRequeridas: number;
}

export interface RutaPasadaEtapaCreate {
  id?: number;
  etapa: number;
  orden: number;
  pesoMinimo: number;
  pesoIdeal: number;
  pesoMaximo: number;
  cantidadMuestrasRequeridas: number;
}

export interface Ruta {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  etapas?: RutaPasadaEtapa[];
}

export interface RutaCreate extends Omit<Ruta, 'id' | 'etapas'> {
  etapas: RutaPasadaEtapaCreate[];
}

export type RutaUpdate = Partial<Omit<RutaCreate, 'etapas'>> & {
  etapas?: RutaPasadaEtapaCreate[];
  activo?: boolean;
};

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

export const updateRuta = async (id: number, ruta: RutaUpdate): Promise<Ruta> => {
  const response = await api.put<ApiEnvelope<Ruta>>(`/rutas-pasadas/${id}`, ruta);
  return response.data.data;
};

export const deleteRuta = async (id: number): Promise<void> => {
  await api.delete(`/rutas-pasadas/${id}`);
};
