import api from './axios';
import type { SesionActiva } from '../shared/types/auth';

export const loginApi = async (credentials: { legajo: string; pin: string }): Promise<{ token: string }> => {
  const response = await api.post('/auth/login', credentials);
  return response.data.data; // assuming data is wrapped in data, wait I will just return response.data
};

export const abrirSesionLinea = async (lineaId: number) => {
  await api.post('/sesion-linea', { lineaProduccionId: lineaId });
};

export const actualizarActividad = async () => {
  await api.patch('/auth/actividad');
};

export const getSesionActiva = async (): Promise<SesionActiva> => {
  const response = await api.get('/sesion-activa');
  return response.data;
};

export const cerrarSesionLinea = async (lineaId?: number) => {
  await api.post('/cerrar-sesion', { lineaProduccionId: lineaId });
};
