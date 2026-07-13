import api from './axios';

export interface Dispositivo {
  hardwareId: string;
  nombre: string;
  lineaId: number | null;
  lineaNombre: string | null;
  estado: 'Conectado' | 'Desconectado';
  ultimaConexionAt: string | null;
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
};
