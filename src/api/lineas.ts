import api from './axios';
import { fetchPage, type Page, type PageQuery } from './pagination';
import type { Ruta } from '../shared/types/domain';

export interface AssignedDevice {
  hardwareId: string;
  nombre: string;
  ultimaConexionAt: string | null;
}

export interface Linea {
  id?: number;
  nombre: string;
  dispositivo?: AssignedDevice | null;
  rutaPasadaActiva?: Ruta | null;
  activo?: boolean;
  estado?: 'disponible' | 'ocupada';
  idBalanza?: number;
  articuloId?: number;
  observacion?: string | null;
}

export interface LineaCreate extends Omit<Linea, 'id' | 'rutaPasadaActiva' | 'dispositivo'> {
  rutaPasadaActiva?: number | null;
  idBalanza: number;
  articuloId: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const getLineas = (query?: PageQuery): Promise<Page<Linea>> =>
  fetchPage<Linea>('/lineas-produccion', query);

export const getLineasInactivas = (query?: PageQuery): Promise<Page<Linea>> =>
  fetchPage<Linea>('/lineas-produccion/inactive', query);

export const getLinea = async (id: number): Promise<Linea> => {
  const response = await api.get<ApiEnvelope<Linea>>(`/lineas-produccion/${id}`);
  return response.data.data;
};

export const createLinea = async (linea: LineaCreate): Promise<Linea> => {
  const response = await api.post<ApiEnvelope<Linea>>('/lineas-produccion', linea);
  return response.data.data;
};

export const updateLinea = async (id: number, linea: Partial<LineaCreate>): Promise<Linea> => {
  const response = await api.put<ApiEnvelope<Linea>>(`/lineas-produccion/${id}`, linea);
  return response.data.data;
};

export const deleteLinea = async (id: number): Promise<void> => {
  await api.delete(`/lineas-produccion/${id}`);
};

export const assignDeviceToLinea = async (id: number, hardwareId: string | null): Promise<Linea> => {
  // Pass null to unassign if API supports it, though schema requires a string UUID.
  // Assuming the backend has been adjusted or we just pass the hardwareId for assignment.
  const response = await api.put<ApiEnvelope<Linea>>(`/lineas-produccion/${id}/device`, { hardwareId });
  return response.data.data;
};
