import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  describe('auto-centering the active stage', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('centers the active stage on mount', () => {
      const scrollIntoViewSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});

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
      ];

      render(<StageProgressPanel etapasConEstado={etapas} />);

      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    });

    it('re-centers when the active stage advances', () => {
      const scrollIntoViewSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});

      const makeEtapas = (activeId: number): EtapaConEstado[] => [
        {
          etapa: { id: 1, orden: 1, pesoMinimo: 0, pesoIdeal: 0, pesoMaximo: 0, cantidadMuestrasRequeridas: 2, etapa: { id: 10, nombre: 'Stage 1' } },
          estado: activeId === 10 ? 'actual' : 'completada',
          muestrasOk: 2,
          muestrasRequeridas: 2,
        },
        {
          etapa: { id: 2, orden: 2, pesoMinimo: 0, pesoIdeal: 0, pesoMaximo: 0, cantidadMuestrasRequeridas: 3, etapa: { id: 20, nombre: 'Stage 2' } },
          estado: activeId === 20 ? 'actual' : 'pendiente',
          muestrasOk: 0,
          muestrasRequeridas: 3,
        },
      ];

      const { rerender } = render(<StageProgressPanel etapasConEstado={makeEtapas(10)} />);
      expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);

      rerender(<StageProgressPanel etapasConEstado={makeEtapas(20)} />);
      expect(scrollIntoViewSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('advance signal transitions (state, not animation frames)', () => {
    const makeEtapas = (activeId: number): EtapaConEstado[] => [
      {
        etapa: { id: 1, orden: 1, pesoMinimo: 0, pesoIdeal: 0, pesoMaximo: 0, cantidadMuestrasRequeridas: 2, etapa: { id: 10, nombre: 'Stage 1' } },
        estado: activeId === 10 ? 'actual' : activeId > 10 ? 'completada' : 'pendiente',
        muestrasOk: activeId >= 10 ? 2 : 0,
        muestrasRequeridas: 2,
      },
      {
        etapa: { id: 2, orden: 2, pesoMinimo: 0, pesoIdeal: 0, pesoMaximo: 0, cantidadMuestrasRequeridas: 3, etapa: { id: 20, nombre: 'Stage 2' } },
        estado: activeId === 20 ? 'actual' : activeId > 20 ? 'completada' : 'pendiente',
        muestrasOk: activeId >= 20 ? 1 : 0,
        muestrasRequeridas: 3,
      },
    ];

    it('marks the completada circle with a data-estado="completada" testid after a forward transition', () => {
      const { rerender } = render(
        <StageProgressPanel etapasConEstado={makeEtapas(10)} advanceSignal={{ kind: 'none' }} />
      );

      rerender(
        <StageProgressPanel
          etapasConEstado={makeEtapas(20)}
          advanceSignal={{ kind: 'forward', etapaId: 20, nombre: 'Stage 2' }}
        />
      );

      expect(screen.getByTestId('stage-circle-10')).toHaveAttribute('data-estado', 'completada');
      expect(screen.getByTestId('stage-circle-20')).toHaveAttribute('data-estado', 'actual');
    });

    it('renders a ring-pulse testid on the incoming actual circle only on a forward advance', () => {
      render(
        <StageProgressPanel
          etapasConEstado={makeEtapas(20)}
          advanceSignal={{ kind: 'forward', etapaId: 20, nombre: 'Stage 2' }}
        />
      );

      expect(screen.getByTestId('stage-circle-20-ring-pulse')).toBeInTheDocument();
    });

    it('does NOT render the ring-pulse testid on a backward (regression) transition', () => {
      render(
        <StageProgressPanel
          etapasConEstado={makeEtapas(10)}
          advanceSignal={{ kind: 'backward', etapaId: 10, nombre: 'Stage 1' }}
        />
      );

      expect(screen.queryByTestId('stage-circle-10-ring-pulse')).not.toBeInTheDocument();
    });

    it('does NOT render the ring-pulse testid when there is no advance signal', () => {
      render(
        <StageProgressPanel etapasConEstado={makeEtapas(20)} advanceSignal={{ kind: 'none' }} />
      );

      expect(screen.queryByTestId('stage-circle-20-ring-pulse')).not.toBeInTheDocument();
    });
  });
});
