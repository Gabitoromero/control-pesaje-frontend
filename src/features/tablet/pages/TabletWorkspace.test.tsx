import { screen, waitFor } from '@testing-library/react';
import { renderWithAuth } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import type { User } from '../../../shared/types/auth';
import { TabletWorkspace } from './TabletWorkspace';
import { vi, describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useBalanzaWebSocket } from '../hooks/useBalanzaWebSocket';

// Mock useBalanzaWebSocket hook
vi.mock('../hooks/useBalanzaWebSocket', () => ({
  useBalanzaWebSocket: vi.fn(),
}));

// Mock useActividadHeartbeat hook
vi.mock('../hooks/useActividadHeartbeat', () => ({
  useActividadHeartbeat: vi.fn(),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const BASE = 'http://localhost:3000/api';

const handlers = [
  http.get(`${BASE}/pasadas/101`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 101,
        lineaProduccionId: 1,
        usuarioId: 3,
        estado: 'en_curso',
        articuloId: 1,
        createdAt: '2026-06-23T18:44:38Z',
        updatedAt: '2026-06-23T18:44:38Z',
        muestras: [],
      },
    });
  }),
  http.get(`${BASE}/lineas-produccion/1`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        nombre: 'Línea 1 — Envasado A',
        numeroBalanza: 1,
        activo: true,
        rutaPasadaActiva: {
          id: 1,
          nombre: 'Ruta 1',
          activo: true,
          etapas: [
            {
              id: 10,
              etapa: { id: 1, nombre: 'Amasado' },
              orden: 1,
              pesoMinimo: 10,
              pesoIdeal: 15,
              pesoMaximo: 20,
              cantidadMuestrasRequeridas: 2,
            },
            {
              id: 11,
              etapa: { id: 2, nombre: 'Horneado' },
              orden: 2,
              pesoMinimo: 30,
              pesoIdeal: 35,
              pesoMaximo: 40,
              cantidadMuestrasRequeridas: 1,
            },
          ],
        },
      },
    });
  }),
  http.post(`${BASE}/muestras`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 50,
        pesoNeto: 15,
        estadoValidacion: 'ok',
        usuarioId: 3,
        etapaId: 1,
        lineaProduccionId: 1,
        timestamp: '2026-06-23T20:00:00Z',
      },
    });
  }),
  http.delete(`${BASE}/muestras/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
  http.put(`${BASE}/pasadas/101`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 101,
        estado: 'completa',
      },
    });
  }),
];

const server = setupServer(...handlers);

const operarioUser: User = {
  id: 3,
  legajo: 'O1',
  nombreUsuario: 'operario1',
  rol: 'operario',
  puedeTomarMuestrasLibres: false,
};

describe('TabletWorkspace', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    navigateMock.mockClear();
    // Default WebSocket mock state: connected with weight 15.000
    vi.mocked(useBalanzaWebSocket).mockReturnValue({
      pesoNeto: 15.0,
      isConnected: true,
    });
    
    // Mock localStorage
    const store: Record<string, string> = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
        clear: vi.fn(() => { for (const key in store) delete store[key]; }),
      },
      writable: true
    });
  });

  it('navega a /tablet/pasadas sin cerrar sesión al hacer click en Volver', async () => {
    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    const btnVolver = await screen.findByRole('button', { name: /volver/i });
    await userEvent.click(btnVolver);
    expect(navigateMock).toHaveBeenCalledWith('/tablet/pasadas');
  });

  it('redirige a /tablet/seleccion-linea si activeLineaId es null', () => {
    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: null,
      initialEntries: ['/tablet?pasadaId=101'],
    });
    expect(screen.queryByText(/Operario:/i)).not.toBeInTheDocument();
  });

  it('renderiza la etapa activa y los detalles de la pasada', async () => {
    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    // Verify it renders Line name and stage name from MSW handlers
    expect(await screen.findByText('Línea 1 — Envasado A')).toBeInTheDocument();
    expect((await screen.findAllByText('Amasado'))[0]).toBeInTheDocument();
    expect(screen.getByText('0 / 2 muestras OK')).toBeInTheDocument();

    // Tolerance OK badge + params row (pesoNeto=15 is within [10,20] for Amasado)
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('15.000 kg')).toBeInTheDocument();
    expect(screen.getByText('10.000 kg')).toBeInTheDocument();
    expect(screen.getByText('20.000 kg')).toBeInTheDocument();

    // Registrar Muestra button uses success token, not primary
    const btnRegistrar = screen.getByRole('button', { name: /registrar muestra/i });
    expect(btnRegistrar.className).toContain('bg-success');
    expect(btnRegistrar.className).not.toContain('bg-primary');
  });

  it('muestra el badge "Fuera de Rango" cuando el peso está fuera de tolerancia', async () => {
    vi.mocked(useBalanzaWebSocket).mockReturnValue({
      pesoNeto: 5.0,
      isConnected: true,
    });

    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    expect((await screen.findAllByText('Amasado'))[0]).toBeInTheDocument();
    expect(screen.getByText('Fuera de Rango')).toBeInTheDocument();
  });

  it('muestra "Listo para finalizar" cuando todas las etapas están completadas', async () => {
    window.localStorage.setItem('pasada_101_completed', JSON.stringify([1, 2]));

    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    expect((await screen.findAllByText('Listo para finalizar'))[0]).toBeInTheDocument();
  });

  it('simula el registro exitoso de una muestra y actualiza el conteo', async () => {
    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    // Wait for the workspace to load
    expect((await screen.findAllByText('Amasado'))[0]).toBeInTheDocument();

    const btnRegistrar = screen.getByRole('button', { name: /registrar muestra/i });
    await userEvent.click(btnRegistrar);

    // After clicking register, the sample list should contain the new sample.
    // Note: '15.000 kg' also matches the tolerance params row (IDEAL=15 for Amasado).
    expect((await screen.findAllByText('15.000 kg')).length).toBeGreaterThan(0);
    expect(screen.getByText('1 / 2 muestras OK')).toBeInTheDocument();
  });

  it('muestra el lockout overlay cuando la balanza se desconecta', async () => {
    // Set connection status to disconnected
    vi.mocked(useBalanzaWebSocket).mockReturnValue({
      pesoNeto: 0,
      isConnected: false,
    });

    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    // Should display signal lost overlay
    expect(await screen.findByText('Señal de Balanza Perdida')).toBeInTheDocument();
    expect(screen.getByText(/La comunicación con la balanza se ha interrumpido/i)).toBeInTheDocument();
  });

  it('muestra el lockout overlay cuando una llamada API falla', async () => {
    // Override MSW handler for getPasada to fail
    server.use(
      http.get(`${BASE}/pasadas/101`, () => {
        return HttpResponse.json({
          success: false,
          error: { message: 'Servidor no disponible' },
        }, { status: 500 });
      })
    );

    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    // Overlay for connection error should be shown with api error details
    expect(await screen.findByText('Error de Conexión')).toBeInTheDocument();
    expect(screen.getByText('Servidor no disponible')).toBeInTheDocument();
  });

  it('completa la pasada y redirige a gestion al presionar Finalizar Pasada', async () => {
    // Return a pasada that already has all samples registered
    server.use(
      http.get(`${BASE}/pasadas/101`, () => {
        return HttpResponse.json({
          success: true,
          data: {
            id: 101,
            lineaProduccionId: 1,
            usuarioId: 3,
            estado: 'en_curso',
            articuloId: 1,
            createdAt: '2026-06-23T18:44:38Z',
            updatedAt: '2026-06-23T18:44:38Z',
          },
        });
      }),
      http.get(`${BASE}/muestras`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('pasadaId') === '101') {
          return HttpResponse.json({
            success: true,
            data: [
              {
                id: 1,
                pesoNeto: 15,
                estadoValidacion: 'ok',
                usuarioId: 3,
                etapaId: 1,
                lineaProduccionId: 1,
                timestamp: '2026-06-23T19:00:00Z',
              },
              {
                id: 2,
                pesoNeto: 16,
                estadoValidacion: 'ok',
                usuarioId: 3,
                etapaId: 1,
                lineaProduccionId: 1,
                timestamp: '2026-06-23T19:05:00Z',
              },
              {
                id: 3,
                pesoNeto: 35,
                estadoValidacion: 'ok',
                usuarioId: 3,
                etapaId: 2,
                lineaProduccionId: 1,
                timestamp: '2026-06-23T19:10:00Z',
              },
            ],
          });
        }
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    // Advance first stage (Amasado)
    expect(await screen.findByRole('button', { name: /siguiente etapa/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /siguiente etapa/i }));

    // Advance second stage (Horneado) which makes it ready to finalize
    expect(await screen.findByRole('button', { name: /finalizar pasada/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /finalizar pasada/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/tablet/pasadas');
    });
  });

  it('muestra el PasadaBlock (numero de pasada + hora de inicio) en el panel de muestras', async () => {
    server.use(
      http.get(`${BASE}/pasadas/101`, () => {
        return HttpResponse.json({
          success: true,
          data: {
            id: 101,
            lineaProduccionId: 1,
            usuarioId: 3,
            estado: 'en_curso',
            articuloId: 1,
            numero: 7,
            horaInicio: '2026-06-23T18:44:38Z',
            createdAt: '2026-06-23T18:44:38Z',
            updatedAt: '2026-06-23T18:44:38Z',
            muestras: [],
          },
        });
      })
    );

    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    expect((await screen.findAllByText('Pasada #7'))[0]).toBeInTheDocument();
    expect(screen.getByText(/Inicio \d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('renders StageProgressPanel with stages in order', async () => {
    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    // Wait for the workspace to load
    expect((await screen.findAllByText('Amasado'))[0]).toBeInTheDocument();

    // Verify StageProgressPanel is rendered via test id
    const panel = screen.getByTestId('stage-progress-panel');
    expect(panel).toBeInTheDocument();
  });

  // ── MuestraObservacionPopup integration (task 3.2) ──────────────────────────

  it('clicking a sample row opens the MuestraObservacionPopup', async () => {
    // Seed a muestra so the inline list has a clickable row
    server.use(
      http.get(`${BASE}/muestras`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('pasadaId') === '101') {
          return HttpResponse.json({
            success: true,
            data: [
              {
                id: 50,
                pesoNeto: 15,
                estadoValidacion: 'ok',
                usuarioId: 3,
                etapaId: 1,
                lineaProduccionId: 1,
                timestamp: '2026-06-23T19:00:00Z',
                observacion: '',
              },
            ],
          });
        }
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    // Wait for the sample row to render.
    // Note: '15.000 kg' can also match the tolerance params row (IDEAL=15 for Amasado),
    // so scope the query to the element with a <li> ancestor (the sample row itself).
    await screen.findAllByText('15.000 kg');
    const row = screen.getAllByText('15.000 kg').map((el) => el.closest('li')).find(Boolean)!;
    await userEvent.click(row);

    // Popup should now be open showing the sample number
    expect(await screen.findByText(/Muestra #1/)).toBeInTheDocument();
  });

  it('does not render an inline delete (Descartar) button on sample rows', async () => {
    server.use(
      http.get(`${BASE}/muestras`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('pasadaId') === '101') {
          return HttpResponse.json({
            success: true,
            data: [
              {
                id: 50,
                pesoNeto: 15,
                estadoValidacion: 'ok',
                usuarioId: 3,
                etapaId: 1,
                lineaProduccionId: 1,
                timestamp: '2026-06-23T19:00:00Z',
              },
            ],
          });
        }
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    // '15.000 kg' also matches the tolerance params row (IDEAL=15 for Amasado) — use findAllByText.
    expect((await screen.findAllByText('15.000 kg')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /descartar muestra/i })).not.toBeInTheDocument();
  });
});
