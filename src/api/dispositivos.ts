import api from './axios';
import type { UnidadPeso } from '../shared/types/domain';

export interface Dispositivo {
  hardwareId: string;
  nombre: string;
  lineaId: number | null;
  lineaNombre: string | null;
  estado: 'Conectado' | 'Desconectado';
  ultimaConexionAt: string | null;
  unidad?: UnidadPeso;
}

export const dispositivosApi = {
  getConectados: async (): Promise<Dispositivo[]> => {
    const response = await api.get<{ success: boolean; data: Dispositivo[] }>('/dispositivos/conectados');
    return response.data.data;
  },

  createDispositivo: async (hardwareId: string, nombre?: string): Promise<Dispositivo> => {
    const response = await api.post<{ success: boolean; data: Dispositivo }>('/dispositivos', { hardwareId, nombre });
    return response.data.data;
  },

  updateDispositivo: async (hardwareId: string, data: { nombre: string }): Promise<Dispositivo> => {
    const response = await api.put<{ success: boolean; data: Dispositivo }>(`/dispositivos/${hardwareId}`, data);
    return response.data.data;
  },

  deleteDispositivo: async (hardwareId: string): Promise<void> => {
    await api.delete(`/dispositivos/${hardwareId}`);
  },

  updateUnidad: async (hardwareId: string, unidad: UnidadPeso): Promise<Dispositivo> => {
    const response = await api.patch<{ success: boolean; data: Dispositivo }>(
      `/dispositivos/${hardwareId}/unidad`,
      { unidad }
    );
    return response.data.data;
  },
};
