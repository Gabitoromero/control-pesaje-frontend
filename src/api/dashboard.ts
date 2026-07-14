import api from './axios';

export interface DashboardLineaItem {
  id: number;
  nombre: string;
  activo: boolean;
  rutaPasadaActiva?: {
    id: number;
    nombre: string;
  };
  dispositivo?: {
    id: number;
  } | null;
}

export interface DashboardLineaResumen {
  conectado: boolean;
  pasadaEnCurso: {
    id: number;
    horaInicio: string;
    estado: string;
    tiempoTranscurrido: number;
    rutaPasada?: {
      id: number;
      nombre: string;
    };
  } | null;
}

export interface DashboardKpi {
  muestrasTotales: number;
  fueraRango: number;
  pasadasFinalizadas: number;
  pasadasEnCurso: number;
}

export interface DashboardEtapaMuestra {
  peso: number;
  time: string;
}

export interface DashboardEtapa {
  etapa: {
    id: number;
    nombre: string;
  };
  pesoIdeal: number;
  pesoMinimo: number;
  pesoMaximo: number;
  ultimoPeso: number;
  porcentajeConforme: number;
  timeSeries: DashboardEtapaMuestra[];
}

export const getDashboardLineas = async (): Promise<DashboardLineaItem[]> => {
  const response = await api.get('/dashboard/lineas');
  return response.data.data;
};

export const getDashboardResumen = async (lineaId: number): Promise<DashboardLineaResumen> => {
  const response = await api.get(`/dashboard/${lineaId}/resumen`);
  return response.data.data;
};

export const getDashboardKpis = async (lineaId: number): Promise<DashboardKpi> => {
  const response = await api.get(`/dashboard/${lineaId}/kpis`);
  return response.data.data;
};

export const getDashboardEtapas = async (lineaId: number): Promise<DashboardEtapa[]> => {
  const response = await api.get(`/dashboard/${lineaId}/etapas`);
  return response.data.data;
};
