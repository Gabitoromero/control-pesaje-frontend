import api from './axios';

export interface DashboardLineaItem {
  id: number;
  nombre: string;
  activo: boolean;
  rutaAsignadaAt: string | null; // x1: moment the current route was assigned to this line
  rutaPasadaActiva?: {
    id: number;
    nombre: string;
  };
  dispositivo?: {
    id: string; // hardwareId — string, not numeric DB id
  } | null;
}

export interface DashboardLineaResumen {
  conectado: boolean;
  tiempoDesdeRuta: number | null; // ms since x1 (rutaAsignadaAt). null if route was never stamped.
  pasadaEnCurso: {
    id: number;
    horaInicio: string;
    estado: string;
    tiempoTranscurrido: number; // ms since this specific pasada started
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
  pasadaId: number | null;          // null = muestra libre (sin pasada activa)
  estadoValidacion: 'ok' | 'fuera_de_rango';
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
  muestrasConformes: number;
  muestrasFueraRango: number;
  muestrasTotales: number;
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
