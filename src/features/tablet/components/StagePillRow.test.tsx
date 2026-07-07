import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StagePillRow } from './StagePillRow';
import type { RutaPasadaEtapa, Muestra } from '../../../shared/types/domain';

function makeEtapa(id: number, orden: number, cantidadMuestrasRequeridas: number, nombre?: string): RutaPasadaEtapa {
  return {
    id,
    etapa: { id, nombre: nombre ?? `Etapa ${id}` },
    orden,
    pesoMinimo: 0,
    pesoIdeal: 0,
    pesoMaximo: 0,
    cantidadMuestrasRequeridas,
  };
}

function makeMuestra(etapaId: number, estadoValidacion: Muestra['estadoValidacion'] = 'ok'): Muestra {
  return {
    pesoNeto: 10,
    estadoValidacion,
    usuarioId: 1,
    etapaId,
    lineaProduccionId: 1,
    timestamp: new Date().toISOString(),
  };
}

describe('StagePillRow', () => {
  it('renders nothing when etapas is empty', () => {
    const { container } = render(<StagePillRow etapas={[]} muestras={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the current stage pill with an arrow indicator when there are no muestras yet', () => {
    const etapas = [makeEtapa(1, 1, 2, 'Recepcion')];

    render(<StagePillRow etapas={etapas} muestras={[]} />);

    expect(screen.getByText('Recepcion')).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it('renders done stages with a checkmark and the current stage with an arrow', () => {
    const etapas = [makeEtapa(1, 1, 1, 'Recepcion'), makeEtapa(2, 2, 1, 'Secado'), makeEtapa(3, 3, 1, 'Empaque')];
    const muestras = [makeMuestra(1)];

    render(<StagePillRow etapas={etapas} muestras={muestras} />);

    expect(screen.getByText('Recepcion')).toBeInTheDocument();
    expect(screen.getByText('Secado')).toBeInTheDocument();
    expect(screen.queryByText('Empaque')).not.toBeInTheDocument();
  });

  it('caps visible done pills at MAX_VISIBLE_DONE (3) and shows a muted +N overflow pill for the rest', () => {
    const etapas = [
      makeEtapa(1, 1, 1, 'E1'),
      makeEtapa(2, 2, 1, 'E2'),
      makeEtapa(3, 3, 1, 'E3'),
      makeEtapa(4, 4, 1, 'E4'),
      makeEtapa(5, 5, 1, 'E5'),
      makeEtapa(6, 6, 1, 'E6'),
    ];
    const muestras = [makeMuestra(1), makeMuestra(2), makeMuestra(3), makeMuestra(4), makeMuestra(5)];

    render(<StagePillRow etapas={etapas} muestras={muestras} />);

    // done: E1..E5 (5 done stages), only last 3 (E3, E4, E5) shown, E1/E2 collapsed into +2
    expect(screen.queryByText('E1')).not.toBeInTheDocument();
    expect(screen.queryByText('E2')).not.toBeInTheDocument();
    expect(screen.getByText('E3')).toBeInTheDocument();
    expect(screen.getByText('E4')).toBeInTheDocument();
    expect(screen.getByText('E5')).toBeInTheDocument();
    expect(screen.getByText('E6')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('does not render a pill for pending stages beyond the current one', () => {
    const etapas = [makeEtapa(1, 1, 1, 'E1'), makeEtapa(2, 2, 1, 'E2'), makeEtapa(3, 3, 1, 'E3')];
    const muestras: Muestra[] = [];

    render(<StagePillRow etapas={etapas} muestras={muestras} />);

    expect(screen.getByText('E1')).toBeInTheDocument();
    expect(screen.queryByText('E2')).not.toBeInTheDocument();
    expect(screen.queryByText('E3')).not.toBeInTheDocument();
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it('renders no current-stage pill when every stage is already done', () => {
    const etapas = [makeEtapa(1, 1, 1, 'E1'), makeEtapa(2, 2, 1, 'E2')];
    const muestras = [makeMuestra(1), makeMuestra(2)];

    render(<StagePillRow etapas={etapas} muestras={muestras} />);

    expect(screen.getByText('E1')).toBeInTheDocument();
    expect(screen.getByText('E2')).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });
});
