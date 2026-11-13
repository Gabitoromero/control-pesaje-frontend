import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { RutaFormPage } from './RutaFormPage';
import { etapaSchema } from './RutaFormPage.schemas';
import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';

const navigateMock = vi.fn();
let paramsMock: { id?: string } = {};
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock, useParams: () => paramsMock };
});

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => {
  navigateMock.mockClear();
  server.resetHandlers();
  paramsMock = {};
});
afterAll(() => server.close());

const baseEtapa = { etapa: 1, pesoMinimo: 10, pesoIdeal: 15, pesoMaximo: 20, cantidadMuestrasRequeridas: 1 };

describe('RutaFormPage schema — cualidades', () => {
  it('accepts an etapa without cualidades and with numeric and aceptado ones', () => {
    expect(etapaSchema.safeParse(baseEtapa).success).toBe(true);
    const r = etapaSchema.safeParse({
      ...baseEtapa,
      atributos: [
        { nombre: 'Temperatura (°C)', tipo: 'numerico', minimo: 0, maximo: 99 },
        { nombre: 'Degustación', tipo: 'aceptado', minimo: null, maximo: null },
      ],
    });
    expect(r.success).toBe(true);
  });

  it('requires nombre, and a full range with minimo <= maximo for a numeric cualidad', () => {
    const issues = (atributos: unknown[]) => {
      const r = etapaSchema.safeParse({ ...baseEtapa, atributos });
      return r.success ? [] : r.error.issues.map((i) => [i.path.join('.'), i.message]);
    };
    expect(issues([{ nombre: '', tipo: 'aceptado' }])).toEqual([['atributos.0.nombre', 'Requerido']]);
    expect(issues([{ nombre: 'T', tipo: 'numerico', minimo: null, maximo: 5 }])).toEqual([['atributos.0.minimo', 'Requerido']]);
    expect(issues([{ nombre: 'T', tipo: 'numerico', minimo: 1, maximo: null }])).toEqual([['atributos.0.maximo', 'Requerido']]);
    expect(issues([{ nombre: 'T', tipo: 'numerico', minimo: 9, maximo: 2 }])).toEqual([['atributos.0.maximo', 'Debe ser mayor o igual al mínimo']]);
    expect(issues([{ nombre: 'T', tipo: 'numerico', minimo: 5, maximo: 5 }])).toEqual([]);
  });

  it('allows at most 2 cualidades per etapa and no repeated names', () => {
    const tres = ['A', 'B', 'C'].map((nombre) => ({ nombre, tipo: 'aceptado' }));
    expect(etapaSchema.safeParse({ ...baseEtapa, atributos: tres }).success).toBe(false);
    const repetidas = etapaSchema.safeParse({
      ...baseEtapa,
      atributos: [{ nombre: 'Altura', tipo: 'aceptado' }, { nombre: ' altura ', tipo: 'aceptado' }],
    });
    expect(repetidas.success).toBe(false);
    if (!repetidas.success) expect(repetidas.error.issues[0].message).toBe('Ya existe una cualidad con ese nombre');
  });
});

describe('RutaFormPage — cualidades por etapa', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const capture = (method: 'put' | 'post' = 'put'): { payload: any } => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const holder: { payload: any } = { payload: null };
    const url = method === 'put' ? 'http://localhost:3000/api/rutas-pasadas/:id' : 'http://localhost:3000/api/rutas-pasadas';
    server.use(
      http[method](url, async ({ request }) => {
        holder.payload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 1, ...holder.payload } }, { status: method === 'post' ? 201 : 200 });
      }),
    );
    return holder;
  };

  const withAtributos = () =>
    server.use(
      http.get('http://localhost:3000/api/rutas-pasadas/:id', () =>
        HttpResponse.json({
          success: true,
          data: {
            id: 1, nombre: 'Ruta Alpha', descripcion: 'Descripción Alpha', activo: true,
            etapas: [
              {
                id: 10, etapa: { id: 1, nombre: 'Amasado' }, orden: 1, pesoMinimo: 10, pesoIdeal: 15, pesoMaximo: 20, cantidadMuestrasRequeridas: 2,
                atributos: [
                  { id: 100, nombre: 'Temperatura (°C)', tipo: 'numerico', minimo: 0, maximo: 99 },
                  { id: 101, nombre: 'Degustación', tipo: 'aceptado', minimo: 1, maximo: 1 },
                ],
              },
              { id: 11, etapa: { id: 2, nombre: 'Horneado' }, orden: 2, pesoMinimo: 30, pesoIdeal: 35, pesoMaximo: 40, cantidadMuestrasRequeridas: 1, atributos: [] },
            ],
          },
        }),
      ),
    );

  const openEdit = async () => {
    paramsMock = { id: '1' };
    renderWithProviders(<RutaFormPage />);
    const container = await screen.findByTestId('etapas-container');
    await userEvent.click(screen.getByRole('button', { name: /etapas de la ruta/i }));
    await waitFor(() => expect(within(container).getAllByTitle(/Arrastrar para reordenar/)).toHaveLength(2));
    return container;
  };
  const guardar = () => userEvent.click(screen.getByRole('button', { name: /guardar/i }));

  it('an etapa without cualidades shows none and offers to add one; saving sends an empty list', async () => {
    const holder = capture();
    const container = await openEdit();

    expect(within(container).getAllByRole('button', { name: /agregar cualidad/i })).toHaveLength(2);
    expect(within(container).queryByLabelText('Nombre de la cualidad')).not.toBeInTheDocument();

    await guardar();
    await waitFor(() => expect(holder.payload).not.toBeNull());
    expect(holder.payload.etapas.map((e: { atributos: unknown[] }) => e.atributos)).toEqual([[], []]);
  });

  it('adds a numeric cualidad with its range to one etapa only', async () => {
    const holder = capture();
    const container = await openEdit();

    await userEvent.click(within(container).getAllByRole('button', { name: /agregar cualidad/i })[0]);
    await userEvent.type(within(container).getByLabelText('Nombre de la cualidad'), 'Temperatura (°C)');
    expect(within(container).getByRole('radio', { name: 'Numérico' })).toBeChecked();
    await userEvent.type(within(container).getByLabelText('Mínimo de la cualidad'), '0');
    await userEvent.type(within(container).getByLabelText('Máximo de la cualidad'), '99');

    await guardar();
    await waitFor(() => expect(holder.payload).not.toBeNull());
    expect(holder.payload.etapas[0].atributos).toEqual([{ nombre: 'Temperatura (°C)', tipo: 'numerico', minimo: 0, maximo: 99 }]);
    expect(holder.payload.etapas[1].atributos).toEqual([]);
  });

  it('an aceptado/no aceptado cualidad has no range inputs and sends no range', async () => {
    const holder = capture();
    const container = await openEdit();

    await userEvent.click(within(container).getAllByRole('button', { name: /agregar cualidad/i })[0]);
    await userEvent.type(within(container).getByLabelText('Nombre de la cualidad'), 'Degustación');
    await userEvent.click(within(container).getByRole('radio', { name: 'Aceptado / No aceptado' }));

    expect(within(container).queryByLabelText('Mínimo de la cualidad')).not.toBeInTheDocument();
    expect(within(container).queryByLabelText('Máximo de la cualidad')).not.toBeInTheDocument();

    await guardar();
    await waitFor(() => expect(holder.payload).not.toBeNull());
    expect(holder.payload.etapas[0].atributos).toEqual([{ nombre: 'Degustación', tipo: 'aceptado' }]);
  });

  it('validates nombre and range and sends nothing while invalid', async () => {
    const holder = capture();
    const container = await openEdit();

    await userEvent.click(within(container).getAllByRole('button', { name: /agregar cualidad/i })[0]);
    await guardar();
    expect(await within(container).findAllByText('Requerido')).not.toHaveLength(0);
    expect(holder.payload).toBeNull();

    await userEvent.type(within(container).getByLabelText('Nombre de la cualidad'), 'Altura');
    await userEvent.type(within(container).getByLabelText('Mínimo de la cualidad'), '9');
    await userEvent.type(within(container).getByLabelText('Máximo de la cualidad'), '2');
    await guardar();
    expect(await within(container).findByText('Debe ser mayor o igual al mínimo')).toBeInTheDocument();
    expect(holder.payload).toBeNull();
  });

  it('stops offering to add after 2 cualidades in an etapa', async () => {
    withAtributos();
    const container = await openEdit();
    const [primera, segunda] = within(container).getAllByRole('button', { name: /agregar cualidad/i });
    expect(primera).toBeDisabled();
    expect(segunda).toBeEnabled();
  });

  it('edit pre-fills the stored cualidades, keeps their ids, and removing one omits it from the payload', async () => {
    withAtributos();
    const holder = capture();
    const container = await openEdit();

    const nombres = within(container).getAllByLabelText('Nombre de la cualidad') as HTMLInputElement[];
    expect(nombres.map((n) => n.value)).toEqual(['Temperatura (°C)', 'Degustación']);
    expect(within(container).getAllByRole('radio', { name: 'Numérico' })[0]).toBeChecked();
    expect(within(container).getAllByRole('radio', { name: 'Aceptado / No aceptado' })[1]).toBeChecked();
    expect(within(container).getByLabelText('Mínimo de la cualidad')).toHaveValue(0);
    expect(within(container).getByLabelText('Máximo de la cualidad')).toHaveValue(99);

    await userEvent.click(within(container).getAllByRole('button', { name: /quitar cualidad/i })[1]);
    await guardar();
    await waitFor(() => expect(holder.payload).not.toBeNull());
    expect(holder.payload.etapas[0].atributos).toEqual([{ id: 100, nombre: 'Temperatura (°C)', tipo: 'numerico', minimo: 0, maximo: 99 }]);
  });

  it('create mode: a new etapa starts without cualidades and one can be added', async () => {
    renderWithProviders(<RutaFormPage />);
    const container = await screen.findByTestId('etapas-container');
    await userEvent.click(screen.getByRole('button', { name: /etapas de la ruta/i }));
    expect(within(container).queryByLabelText('Nombre de la cualidad')).not.toBeInTheDocument();

    await userEvent.click(within(container).getByRole('button', { name: /agregar cualidad/i }));
    expect(within(container).getByLabelText('Nombre de la cualidad')).toBeInTheDocument();
    expect(within(container).getByRole('radio', { name: 'Numérico' })).toBeChecked();
  });
});
