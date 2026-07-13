import api from './axios';
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
}

export interface LineaCreate extends Omit<Linea, 'id' | 'rutaPasadaActiva' | 'dispositivo'> {
  rutaPasadaActiva?: number | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const getLineas = async (): Promise<Linea[]> => {
  const response = await api.get<ApiEnvelope<Linea[]>>('/lineas-produccion');
  return response.data.data;
};

export const getLineasInactivas = async (): Promise<Linea[]> => {
  const response = await api.get<ApiEnvelope<Linea[]>>('/lineas-produccion/inactive');
  return response.data.data;
};

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
