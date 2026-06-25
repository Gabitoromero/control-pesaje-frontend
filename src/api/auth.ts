import api from './axios';
import type { SesionActiva, SesionActivaAdmin } from '../shared/types/auth';

export const loginApi = async (credentials: { legajo: string; pin: string }): Promise<{ token: string }> => {
  const response = await api.post('/auth/login', credentials);
  return response.data.data; // assuming data is wrapped in data, wait I will just return response.data
};

export const abrirSesionLinea = async (lineaId: number) => {
  await api.post('/auth/sesion-linea', { lineaProduccionId: lineaId });
};

export const actualizarActividad = async (lineaId: number) => {
  await api.patch('/auth/actividad', { lineaProduccionId: lineaId });
};

export const getSesionActiva = async (lineaId: number): Promise<SesionActiva> => {
  const response = await api.get(`/auth/sesion-activa/${lineaId}`);
  return response.data;
};

export const cerrarSesionLinea = async (lineaId?: number) => {
  await api.post('/auth/cerrar-sesion', { lineaProduccionId: lineaId });
};

export const getSesionesActivas = async (): Promise<SesionActivaAdmin[]> => {
  const response = await api.get('/auth/sesiones-activas');
  return response.data.data;
};
