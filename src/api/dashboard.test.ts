import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './axios';
import {
  getDashboardLineas,
  getDashboardResumen,
  getDashboardKpis,
  getDashboardEtapas
} from './dashboard';

vi.mock('./axios');

describe('Dashboard API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getDashboardLineas', () => {
    it('returns the data array from the backend response', async () => {
      const mockData = [{ id: 1, nombre: 'Linea 1' }];
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockData } });

      const result = await getDashboardLineas();
      expect(api.get).toHaveBeenCalledWith('/dashboard/lineas');
      expect(result).toEqual(mockData);
    });
  });

  describe('getDashboardResumen', () => {
    it('returns the data object from the backend response', async () => {
      const mockData = { conectado: true, pasadaEnCurso: { id: 1, tiempoTranscurrido: 1000 } };
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockData } });

      const result = await getDashboardResumen(1);
      expect(api.get).toHaveBeenCalledWith('/dashboard/1/resumen');
      expect(result).toEqual(mockData);
    });
  });

  describe('getDashboardKpis', () => {
    it('returns the data object from the backend response', async () => {
      const mockData = { muestrasTotales: 10, fueraRango: 2, pasadasFinalizadas: 5, pasadasEnCurso: 1 };
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockData } });

      const result = await getDashboardKpis(1);
      expect(api.get).toHaveBeenCalledWith('/dashboard/1/kpis');
      expect(result).toEqual(mockData);
    });
  });

  describe('getDashboardEtapas', () => {
    it('returns the data array from the backend response', async () => {
      const mockData = [
        {
          etapa: { id: 1, nombre: 'Etapa 1' },
          pesoIdeal: 100,
          pesoMinimo: 90,
          pesoMaximo: 110,
          ultimoPeso: 105,
          porcentajeConforme: 95,
          timeSeries: [{ peso: 105, time: '2026-07-13T18:00:00.000Z' }]
        }
      ];
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockData } });

      const result = await getDashboardEtapas(1);
      expect(api.get).toHaveBeenCalledWith('/dashboard/1/etapas');
      expect(result).toEqual(mockData);
    });
  });
});
