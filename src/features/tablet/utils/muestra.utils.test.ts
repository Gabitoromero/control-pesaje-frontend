import { describe, it, expect } from 'vitest';
import { normalizeMuestra } from './muestra.utils';

describe('normalizeMuestra', () => {
  it('maps camelCase fields directly when present', () => {
    const raw = {
      id: 42,
      pesoNeto: 15.5,
      estadoValidacion: 'ok',
      usuarioId: 3,
      etapaId: 10,
      lineaProduccionId: 1,
      articuloId: 7,
      timestamp: new Date('2024-01-01'),
    };

    const result = normalizeMuestra(raw);

    expect(result.id).toBe(42);
    expect(result.pesoNeto).toBe(15.5);
    expect(result.estadoValidacion).toBe('ok');
    expect(result.usuarioId).toBe(3);
    expect(result.etapaId).toBe(10);
    expect(result.lineaProduccionId).toBe(1);
    expect(result.articuloId).toBe(7);
  });

  it('maps snake_case fields when camelCase is absent', () => {
    const raw = {
      id: 43,
      peso_neto: 12.0,
      estado_validacion: 'fuera_de_rango',
      usuario_id: 5,
      etapa_id: 20,
      linea_produccion_id: 2,
      articulo_id: 9,
      timestamp: new Date('2024-01-02'),
    };

    const result = normalizeMuestra(raw);

    expect(result.pesoNeto).toBe(12.0);
    expect(result.estadoValidacion).toBe('fuera_de_rango');
    expect(result.usuarioId).toBe(5);
    expect(result.etapaId).toBe(20);
    expect(result.lineaProduccionId).toBe(2);
    expect(result.articuloId).toBe(9);
    // snake_case aliases must also be set
    expect(result.pesoNeto).toBe(12.0);
    expect(result.estadoValidacion).toBe('fuera_de_rango');
  });

  it('extracts id from populated usuario object', () => {
    const raw = {
      id: 1,
      pesoNeto: 15,
      estadoValidacion: 'ok',
      usuario: { id: 7, nombre: 'Juan' },
      etapa: { id: 20, nombre: 'Etapa 2' },
      lineaProduccionId: 1,
      timestamp: new Date(),
    };

    const result = normalizeMuestra(raw);

    expect(result.usuarioId).toBe(7);
    expect(result.etapaId).toBe(20);
  });

  it('extracts id from flat numeric usuario and etapa', () => {
    const raw = {
      id: 2,
      pesoNeto: 15,
      estadoValidacion: 'ok',
      usuario: 8,
      etapa: 10,
      lineaProduccionId: 1,
      timestamp: new Date(),
    };

    const result = normalizeMuestra(raw);

    expect(result.usuarioId).toBe(8);
    expect(result.etapaId).toBe(10);
  });

  it('defaults missing fields to safe values', () => {
    const raw = { id: 99 };

    const result = normalizeMuestra(raw);

    expect(result.pesoNeto).toBe(0);
    expect(result.estadoValidacion).toBe('fuera_de_rango');
    expect(result.usuarioId).toBe(0);
    expect(result.etapaId).toBe(0);
    expect(result.lineaProduccionId).toBe(0);
    expect(result.timestamp).toBeDefined();
  });

  it('preserves all original fields via spread', () => {
    const raw = {
      id: 5,
      pesoNeto: 10,
      estadoValidacion: 'ok',
      usuarioId: 1,
      etapaId: 10,
      lineaProduccionId: 1,
      someExtraField: 'extra',
      timestamp: new Date(),
    };

    const result = normalizeMuestra(raw);

    expect((result as unknown as Record<string, unknown>).someExtraField).toBe('extra');
  });
});
