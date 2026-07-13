// import api from './axios'; // uncomment when switching to real backend

export interface DashboardLineaResumen {
  lineaId: number;
  lineaNombre: string;
  rutaActivaNombre: string;
  tiempoTranscurrido: number; // segundos
  horaInicio: string; // ISO
  conectado: boolean;
}

export interface DashboardKpi {
  totalMuestras: number;
  muestrasFueraDeRango: number;
  pasadasFinalizadas: number;
  pasadasEnCurso: number;
}

export interface DashboardEtapaMuestra {
  timestamp: string;
  pesoNeto: number;
  estadoValidacion: 'ok' | 'fuera_de_rango';
  tipo: 'pasada' | 'libre';
}

export interface DashboardEtapa {
  etapaId: number;
  etapaNombre: string;
  orden: number;
  pesoMinimo: number;
  pesoMaximo: number;
  pesoIdeal: number;
  ultimoPeso: number | null;
  ultimoPesoEstado: 'ok' | 'fuera_de_rango' | null;
  porcentajeConforme: number;
  totalMuestras: number;
  muestrasOk: number;
  muestrasFuera: number;
  muestras: DashboardEtapaMuestra[];
}

export interface DashboardLineaItem {
  id: number;
  nombre: string;
  rutaActiva: string | null;
}

// ─── Mock data for development ────────────────────────────────────────────

const MOCK_LINEAS: DashboardLineaItem[] = [
  { id: 1, nombre: 'Línea 1', rutaActiva: 'Alfajores Triples' },
  { id: 2, nombre: 'Línea 2', rutaActiva: 'Bombones Surtidos' },
  { id: 3, nombre: 'Línea 3', rutaActiva: 'Palito Bombón' },
  { id: 4, nombre: 'Línea 4', rutaActiva: null },
];

const MOCK_RESUMEN: Record<number, DashboardLineaResumen> = {
  1: { lineaId: 1, lineaNombre: 'Línea 1', rutaActivaNombre: 'Alfajores Triples', tiempoTranscurrido: 2538, horaInicio: '2026-07-14T08:00:00', conectado: true },
  2: { lineaId: 2, lineaNombre: 'Línea 2', rutaActivaNombre: 'Bombones Surtidos', tiempoTranscurrido: 1800, horaInicio: '2026-07-14T08:00:00', conectado: true },
  3: { lineaId: 3, lineaNombre: 'Línea 3', rutaActivaNombre: 'Palito Bombón', tiempoTranscurrido: 3600, horaInicio: '2026-07-14T08:00:00', conectado: true },
};

const MOCK_KPIS: Record<number, DashboardKpi> = {
  1: { totalMuestras: 42, muestrasFueraDeRango: 3, pasadasFinalizadas: 5, pasadasEnCurso: 3 },
  2: { totalMuestras: 28, muestrasFueraDeRango: 1, pasadasFinalizadas: 3, pasadasEnCurso: 2 },
  3: { totalMuestras: 65, muestrasFueraDeRango: 7, pasadasFinalizadas: 8, pasadasEnCurso: 4 },
};

function generarMuestras(ok: number, fuera: number): DashboardEtapaMuestra[] {
  const base = Date.now();
  const muestras: DashboardEtapaMuestra[] = [];
  for (let i = 0; i < ok; i++) {
    muestras.push({ timestamp: new Date(base - (ok + fuera - i) * 60000).toISOString(), pesoNeto: 48 + Math.random() * 4, estadoValidacion: 'ok', tipo: Math.random() > 0.2 ? 'pasada' : 'libre' });
  }
  for (let i = 0; i < fuera; i++) {
    muestras.push({ timestamp: new Date(base - (fuera - i) * 60000).toISOString(), pesoNeto: 45 + Math.random() * 10, estadoValidacion: 'fuera_de_rango', tipo: 'pasada' });
  }
  return muestras;
}

const MOCK_ETAPAS: Record<number, DashboardEtapa[]> = {
  1: [
    { etapaId: 1, etapaNombre: 'Dosificado', orden: 1, pesoMinimo: 48, pesoMaximo: 52, pesoIdeal: 50, ultimoPeso: 50.4, ultimoPesoEstado: 'ok', porcentajeConforme: 95, totalMuestras: 22, muestrasOk: 21, muestrasFuera: 1, muestras: generarMuestras(21, 1) },
    { etapaId: 2, etapaNombre: 'Control Final', orden: 2, pesoMinimo: 98, pesoMaximo: 102, pesoIdeal: 100, ultimoPeso: 103.4, ultimoPesoEstado: 'fuera_de_rango', porcentajeConforme: 90, totalMuestras: 20, muestrasOk: 18, muestrasFuera: 2, muestras: generarMuestras(18, 2) },
    { etapaId: 3, etapaNombre: 'Empaque', orden: 3, pesoMinimo: 195, pesoMaximo: 205, pesoIdeal: 200, ultimoPeso: 201.2, ultimoPesoEstado: 'ok', porcentajeConforme: 98, totalMuestras: 15, muestrasOk: 15, muestrasFuera: 0, muestras: generarMuestras(15, 0) },
  ],
};

// ─── API calls (mock for now, switch to real when backend is ready) ──────

export const getDashboardLineas = async (): Promise<DashboardLineaItem[]> => {
  // const response = await api.get('/dashboard/lineas');
  // return response.data.data;
  return Promise.resolve(MOCK_LINEAS);
};

export const getDashboardResumen = async (lineaId: number): Promise<DashboardLineaResumen> => {
  // const response = await api.get(`/dashboard/${lineaId}/resumen`);
  // return response.data.data;
  return Promise.resolve(MOCK_RESUMEN[lineaId] ?? MOCK_RESUMEN[1]);
};

export const getDashboardKpis = async (lineaId: number): Promise<DashboardKpi> => {
  // const response = await api.get(`/dashboard/${lineaId}/kpis`);
  // return response.data.data;
  return Promise.resolve(MOCK_KPIS[lineaId] ?? MOCK_KPIS[1]);
};

export const getDashboardEtapas = async (lineaId: number): Promise<DashboardEtapa[]> => {
  // const response = await api.get(`/dashboard/${lineaId}/etapas`);
  // return response.data.data;
  return Promise.resolve(MOCK_ETAPAS[lineaId] ?? MOCK_ETAPAS[1]);
};
