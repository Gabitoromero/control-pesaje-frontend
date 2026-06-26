import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StageProgressPanel } from './StageProgressPanel';
import type { EtapaConEstado } from '../hooks/usePasadaState';

describe('StageProgressPanel', () => {
  it('renders without crash when empty array', () => {
    const { container } = render(<StageProgressPanel etapasConEstado={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 3 stages in order (completada, actual, pendiente)', () => {
    const etapas: EtapaConEstado[] = [
      {
        etapa: { id: 1, orden: 1, pesoMinimo: 0, pesoIdeal: 0, pesoMaximo: 0, cantidadMuestrasRequeridas: 2, etapa: { id: 10, nombre: 'Stage 1' } },
        estado: 'completada',
        muestrasOk: 2,
        muestrasRequeridas: 2,
      },
      {
        etapa: { id: 2, orden: 2, pesoMinimo: 0, pesoIdeal: 0, pesoMaximo: 0, cantidadMuestrasRequeridas: 3, etapa: { id: 20, nombre: 'Stage 2' } },
        estado: 'actual',
        muestrasOk: 1,
        muestrasRequeridas: 3,
      },
      {
        etapa: { id: 3, orden: 3, pesoMinimo: 0, pesoIdeal: 0, pesoMaximo: 0, cantidadMuestrasRequeridas: 1, etapa: { id: 30, nombre: 'Stage 3' } },
        estado: 'pendiente',
        muestrasOk: 0,
        muestrasRequeridas: 1,
      },
    ];

    render(<StageProgressPanel etapasConEstado={etapas} />);

    // Stage 1: Check completed name is present
    expect(screen.getByText('Stage 1')).toBeDefined();

    // Stage 2: Check counter is present
    expect(screen.getByText('Stage 2')).toBeDefined();
    expect(screen.getByText('1 / 3 muestras OK')).toBeDefined();

    // Stage 3: Check pending name is present
    expect(screen.getByText('Stage 3')).toBeDefined();
  });
});
