import { describe, it, expect } from 'vitest';
import type { AtributoEtapa, Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';
import { deriveCualidadesPendientes } from './cualidadesPendientes';

const temperatura: AtributoEtapa = { id: 100, nombre: 'Temperatura', tipo: 'numerico', minimo: 0, maximo: 99 };
const degustacion: AtributoEtapa = { id: 101, nombre: 'Degustación', tipo: 'aceptado', minimo: 1, maximo: 1 };

const etapa = (id: number, orden: number, requeridas: number, atributos?: AtributoEtapa[]): RutaPasadaEtapa => ({
  id: id * 10,
  etapa: { id, nombre: `E${id}` },
  orden,
  pesoMinimo: 1,
  pesoIdeal: 2,
  pesoMaximo: 3,
  cantidadMuestrasRequeridas: requeridas,
  atributos,
});
const muestra = (etapaId: number, estadoValidacion: Muestra['estadoValidacion'] = 'ok') => ({ etapaId, estadoValidacion }) as Muestra;
const cargados = (...ids: number[]) => new Set(ids);

describe('deriveCualidadesPendientes', () => {
  it('is null while the etapa still lacks samples (cualidades are asked when its samples are done)', () => {
    const etapas = [etapa(1, 1, 2, [temperatura])];
    expect(deriveCualidadesPendientes(etapas, [muestra(1)], cargados())).toBeNull();
  });

  it('returns the etapa and its pending cualidades once the samples are done', () => {
    const etapas = [etapa(1, 1, 2, [temperatura, degustacion]), etapa(2, 2, 1)];
    const r = deriveCualidadesPendientes(etapas, [muestra(1), muestra(1, 'fuera_de_rango')], cargados());
    expect(r?.etapa.etapa.id).toBe(1);
    expect(r?.atributos.map((a) => a.id)).toEqual([100, 101]);
  });

  it('lists only the cualidades still without value', () => {
    const etapas = [etapa(1, 1, 1, [temperatura, degustacion])];
    const r = deriveCualidadesPendientes(etapas, [muestra(1)], cargados(100));
    expect(r?.atributos.map((a) => a.id)).toEqual([101]);
  });

  it('is null when every cualidad is loaded, and when the etapa has none', () => {
    expect(deriveCualidadesPendientes([etapa(1, 1, 1, [temperatura])], [muestra(1)], cargados(100))).toBeNull();
    expect(deriveCualidadesPendientes([etapa(1, 1, 1)], [muestra(1)], cargados())).toBeNull();
    expect(deriveCualidadesPendientes([etapa(1, 1, 1, [])], [muestra(1)], cargados())).toBeNull();
  });

  it('never asks for an etapa that requires no samples', () => {
    expect(deriveCualidadesPendientes([etapa(1, 1, 0, [temperatura])], [], cargados())).toBeNull();
  });

  it('walks by orden: an earlier pending etapa wins and a later one is not asked yet', () => {
    const etapas = [etapa(2, 2, 1, [degustacion]), etapa(1, 1, 1, [temperatura])];
    const r = deriveCualidadesPendientes(etapas, [muestra(1), muestra(2)], cargados());
    expect(r?.etapa.etapa.id).toBe(1);
  });

  it('asks the last etapa too (no next stage, but the operator still loads it)', () => {
    const etapas = [etapa(1, 1, 1, [temperatura]), etapa(2, 2, 1, [degustacion])];
    const r = deriveCualidadesPendientes(etapas, [muestra(1), muestra(2)], cargados(100));
    expect(r?.etapa.etapa.id).toBe(2);
  });

  it('ignores discarded samples when counting', () => {
    const etapas = [etapa(1, 1, 1, [temperatura])];
    expect(deriveCualidadesPendientes(etapas, [muestra(1, 'descartado')], cargados())).toBeNull();
  });
});
