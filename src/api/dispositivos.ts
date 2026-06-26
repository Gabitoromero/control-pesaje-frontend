import api from './axios';

export interface ConnectedDevice {
  socketId: string;
  lineaId: number;
  timestamp: string;
}

export const dispositivosApi = {
  getConectados: async (): Promise<ConnectedDevice[]> => {
    const response = await api.get<ConnectedDevice[]>('/dispositivos/conectados');
    return response.data;
  },
};
