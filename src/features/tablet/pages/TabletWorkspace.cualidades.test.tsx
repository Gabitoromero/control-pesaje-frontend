import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { renderWithAuth } from '../../../test/render';
import { makeBalanzaHookValue } from '../../../test/balanzaHookValue';
import type { User } from '../../../shared/types/auth';
import { TabletWorkspace } from './TabletWorkspace';
import { useBalanzaWebSocket } from '../hooks/useBalanzaWebSocket';

vi.mock('../hooks/useBalanzaWebSocket', () => ({ useBalanzaWebSocket: vi.fn() }));
vi.mock('../hooks/useActividadHeartbeat', () => ({ useActividadHeartbeat: vi.fn() }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const BASE = 'http://localhost:3000/api';

const temperatura = { id: 100, nombre: 'Temperatura (°C)', tipo: 'numerico', minimo: 0, maximo: 99 };
const degustacion = { id: 101, nombre: 'Degustación', tipo: 'aceptado', minimo: 1, maximo: 1 };

const operarioUser: User = { id: 3, legajo: 'O1', nombreUsuario: 'operario1', rol: 'operario', puedeTomarMuestrasLibres: false };

const muestraDe = (id: number, etapaId: number) => ({
  id, pesoNeto: 15, estadoValidacion: 'ok', usuarioId: 3, etapaId, lineaProduccionId: 1, timestamp: `2026-06-23T19:0${id}:00Z`,
});

let muestras: ReturnType<typeof muestraDe>[] = [];
let valoresCargados: Array<{ id: number; atributo: number; etapa: number }> = [];
let postedBodies: unknown[] = [];
let muestraPosts = 0;
let ruta: { etapas: unknown[] };

const rutaConCualidades = (cualidadesEnUltima = false) => ({
  etapas: [
    { id: 10, etapa: { id: 1, nombre: 'Amasado' }, orden: 1, pesoMinimo: 10, pesoIdeal: 15, pesoMaximo: 20, cantidadMuestrasRequeridas: 2, atributos: [temperatura, degustacion] },
    {
      id: 11, etapa: { id: 2, nombre: 'Horneado' }, orden: 2, pesoMinimo: 10, pesoIdeal: 15, pesoMaximo: 20, cantidadMuestrasRequeridas: 1,
      atributos: cualidadesEnUltima ? [{ id: 102, nombre: 'Color', tipo: 'aceptado', minimo: 1, maximo: 1 }] : [],
    },
  ],
});

const server = setupServer(
  http.get(`${BASE}/configuracion/tolerancia`, () =>
    HttpResponse.json({ success: true, data: { toleranciaPct: 20, updatedAt: '2026-09-29T12:00:00.000Z', updatedBy: null } })),
  http.get(`${BASE}/pasadas/101`, () =>
    HttpResponse.json({ success: true, data: { id: 101, lineaProduccionId: 1, usuarioId: 3, estado: 'en_curso', articuloId: 1, createdAt: '2026-06-23T18:44:38Z', updatedAt: '2026-06-23T18:44:38Z', muestras: [] } })),
  http.get(`${BASE}/lineas-produccion/1`, () =>
    HttpResponse.json({ success: true, data: { id: 1, nombre: 'Línea 1', numeroBalanza: 1, activo: true, rutaPasadaActiva: { id: 1, nombre: 'Ruta 1', activo: true, etapas: ruta.etapas } } })),
  http.get(`${BASE}/muestras`, () => HttpResponse.json({ success: true, data: muestras })),
  http.post(`${BASE}/muestras`, () => {
    muestraPosts += 1;
    return HttpResponse.json({ success: true, data: muestraDe(50 + muestraPosts, 1) });
  }),
  http.get(`${BASE}/valores-atributo`, () => HttpResponse.json({ success: true, data: valoresCargados })),
  http.post(`${BASE}/valores-atributo`, async ({ request }) => {
    const body = (await request.json()) as { etapaId: number; valores: Array<{ atributoId: number }> };
    postedBodies.push(body);
    valoresCargados = [...valoresCargados, ...body.valores.map((v, i) => ({ id: 900 + i, atributo: v.atributoId, etapa: body.etapaId }))];
    return HttpResponse.json({ success: true, data: [] }, { status: 201 });
  }),
  http.put(`${BASE}/pasadas/101`, () => HttpResponse.json({ success: true, data: { id: 101, estado: 'completa' } })),
);

const renderWorkspace = () =>
  renderWithAuth(<TabletWorkspace />, { user: operarioUser, activeLineaId: 1, initialEntries: ['/tablet?pasadaId=101'] });

describe('TabletWorkspace — cualidades al completar la etapa', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    muestras = [];
    valoresCargados = [];
    postedBodies = [];
    muestraPosts = 0;
    ruta = rutaConCualidades();
    vi.mocked(useBalanzaWebSocket).mockReturnValue(
      makeBalanzaHookValue({ pesoNeto: 15.0, isConnected: true, hardwareId: undefined, unidad: undefined }),
    );
  });

  it('does not ask anything while the etapa still lacks samples', async () => {
    muestras = [muestraDe(1, 1)];
    renderWorkspace();
    expect(await screen.findByText('1 / 2')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar muestra/i })).toBeEnabled();
  });

  it('opens the blocking dialog right after the last sample of the etapa', async () => {
    muestras = [muestraDe(1, 1)];
    renderWorkspace();
    expect(await screen.findByText('1 / 2')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /registrar muestra/i }));

    muestras = [muestraDe(1, 1), muestraDe(2, 1)];
    expect(await screen.findByRole('dialog', { name: 'Cualidades de Amasado' })).toBeInTheDocument();
  });

  it('blocks Registrar Muestra while cualidades are pending and never posts a sample', async () => {
    muestras = [muestraDe(1, 1), muestraDe(2, 1)];
    renderWorkspace();
    await screen.findByRole('dialog', { name: 'Cualidades de Amasado' });

    expect(screen.getByRole('button', { name: /registrar muestra/i })).toBeDisabled();
    expect(muestraPosts).toBe(0);
  });

  it('loads the values, closes the dialog and lets the operator continue on the next etapa', async () => {
    muestras = [muestraDe(1, 1), muestraDe(2, 1)];
    renderWorkspace();
    await screen.findByRole('dialog', { name: 'Cualidades de Amasado' });

    await userEvent.type(screen.getByLabelText('Temperatura (°C)'), '37.5');
    await userEvent.click(screen.getByRole('radio', { name: 'Aceptado' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cualidades' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(postedBodies).toEqual([
      { pasadaId: 101, etapaId: 1, valores: [{ atributoId: 100, valor: 37.5 }, { atributoId: 101, valor: 1 }] },
    ]);
    expect(screen.getByRole('button', { name: /registrar muestra/i })).toBeEnabled();
  });

  it('keeps the dialog open and shows an error when the values cannot be saved', async () => {
    muestras = [muestraDe(1, 1), muestraDe(2, 1)];
    server.use(
      http.post(`${BASE}/valores-atributo`, () =>
        HttpResponse.json({ success: false, error: { message: 'boom' } }, { status: 422 })),
    );
    renderWorkspace();
    await screen.findByRole('dialog', { name: 'Cualidades de Amasado' });

    await userEvent.type(screen.getByLabelText('Temperatura (°C)'), '10');
    await userEvent.click(screen.getByRole('radio', { name: 'No aceptado' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cualidades' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron guardar las cualidades');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('asks only for what is still missing when some values are already loaded', async () => {
    muestras = [muestraDe(1, 1), muestraDe(2, 1)];
    valoresCargados = [{ id: 1, atributo: 100, etapa: 1 }];
    renderWorkspace();
    await screen.findByRole('dialog', { name: 'Cualidades de Amasado' });

    expect(screen.queryByLabelText('Temperatura (°C)')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'No aceptado' })).toBeInTheDocument();
  });

  it('asks the last etapa too and only offers Finalizar Pasada once its cualidades are loaded', async () => {
    ruta = rutaConCualidades(true);
    muestras = [muestraDe(1, 1), muestraDe(2, 1), muestraDe(3, 2)];
    valoresCargados = [{ id: 1, atributo: 100, etapa: 1 }, { id: 2, atributo: 101, etapa: 1 }];
    renderWorkspace();

    await screen.findByRole('dialog', { name: 'Cualidades de Horneado' });
    expect(screen.queryByRole('button', { name: /finalizar pasada/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Listo para finalizar')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Aceptado' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cualidades' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByRole('button', { name: /finalizar pasada/i })).toBeInTheDocument();
  });

  it('an etapa without cualidades never opens the dialog (previous behavior)', async () => {
    ruta = { etapas: [{ id: 10, etapa: { id: 1, nombre: 'Amasado' }, orden: 1, pesoMinimo: 10, pesoIdeal: 15, pesoMaximo: 20, cantidadMuestrasRequeridas: 2 }] };
    muestras = [muestraDe(1, 1), muestraDe(2, 1)];
    renderWorkspace();

    expect((await screen.findAllByText('Listo para finalizar'))[0]).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
