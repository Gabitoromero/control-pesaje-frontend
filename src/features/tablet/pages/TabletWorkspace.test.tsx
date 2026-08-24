import { screen, waitFor, within } from '@testing-library/react';
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
      hardwareId: undefined,
      unidad: undefined,
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
      hardwareId: undefined,
      unidad: undefined,
    });

    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    expect((await screen.findAllByText('Amasado'))[0]).toBeInTheDocument();
    expect(screen.getByText('Fuera de Rango')).toBeInTheDocument();
  });

  it('muestra "Listo para finalizar" cuando todas las etapas están derivadas como completadas por el conteo de muestras OK', async () => {
    // Etapa 1 (Amasado) requires 2 OK samples, etapa 2 (Horneado) requires 1 —
    // both satisfied purely from the muestras returned by GET /muestras, no
    // client-side pointer involved.
    server.use(
      http.get(`${BASE}/muestras`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('pasadaId') === '101') {
          return HttpResponse.json({
            success: true,
            data: [
              { id: 1, pesoNeto: 15, estadoValidacion: 'ok', usuarioId: 3, etapaId: 1, lineaProduccionId: 1, timestamp: '2026-06-23T19:00:00Z' },
              { id: 2, pesoNeto: 16, estadoValidacion: 'ok', usuarioId: 3, etapaId: 1, lineaProduccionId: 1, timestamp: '2026-06-23T19:05:00Z' },
              { id: 3, pesoNeto: 35, estadoValidacion: 'ok', usuarioId: 3, etapaId: 2, lineaProduccionId: 1, timestamp: '2026-06-23T19:10:00Z' },
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

  it('muestra "Sin señal" y mantiene la página accesible cuando la balanza se desconecta', async () => {
    // Set connection status to disconnected
    vi.mocked(useBalanzaWebSocket).mockReturnValue({
      pesoNeto: 0,
      isConnected: false,
      hardwareId: undefined,
      unidad: undefined,
    });

    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    // Page should remain accessible — no lockout overlay
    expect(await screen.findByText('Línea 1 — Envasado A')).toBeInTheDocument();

    // Should display "Sin señal" status instead of "Conectado"
    expect(screen.getByText('Sin señal')).toBeInTheDocument();

    // Registrar Muestra button should be disabled
    const btnRegistrar = screen.getByRole('button', { name: /registrar muestra/i });
    expect(btnRegistrar).toBeDisabled();
  });

  it('mantiene la página accesible cuando una llamada API falla (sin lockout)', async () => {
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

    // Page should remain accessible — no lockout overlay.
    // Line name is still fetched via the (separate) getLinea query, so
    // the topbar and weighing zone should render with whatever data is available.
    expect(await screen.findByText('Línea 1 — Envasado A')).toBeInTheDocument();

    // "Señal de Balanza Perdida" / "Error de Conexión" lockout overlay must NOT appear.
    expect(screen.queryByText('Señal de Balanza Perdida')).not.toBeInTheDocument();
    expect(screen.queryByText('Error de Conexión')).not.toBeInTheDocument();
  });

  it('no expone un botón manual "Siguiente Etapa" — el avance de etapa es automático y derivado', async () => {
    // Only etapa 1 (Amasado, requires 2) is satisfied; etapa 2 is not yet
    // touched. Auto-advance moves straight to etapa 2 with no button click.
    server.use(
      http.get(`${BASE}/muestras`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('pasadaId') === '101') {
          return HttpResponse.json({
            success: true,
            data: [
              { id: 1, pesoNeto: 15, estadoValidacion: 'ok', usuarioId: 3, etapaId: 1, lineaProduccionId: 1, timestamp: '2026-06-23T19:00:00Z' },
              { id: 2, pesoNeto: 16, estadoValidacion: 'ok', usuarioId: 3, etapaId: 1, lineaProduccionId: 1, timestamp: '2026-06-23T19:05:00Z' },
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

    // Derived active stage is already Horneado (etapa 2) — no manual click needed.
    expect((await screen.findAllByText('Horneado'))[0]).toBeInTheDocument();
    expect(screen.getByText('0 / 1 muestras OK')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /siguiente etapa/i })).not.toBeInTheDocument();
  });

  it('completa la pasada y redirige a gestion al presionar Finalizar Pasada', async () => {
    // Return a pasada that already has all samples registered — both stages
    // derived as completada, so "Finalizar Pasada" is available immediately.
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

    // Both stages already derived as completada — Finalizar Pasada is
    // available directly, no intermediate manual-advance click.
    expect(await screen.findByRole('button', { name: /finalizar pasada/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /finalizar pasada/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/tablet/pasadas');
    });
  });

  // ── Tolerance guard (ux-polish Task 1) ────────────────────────────────────

  it('bloquea el registro y muestra alerta cuando el peso está fuera de tolerancia y el rango es estrecho', async () => {
    // Override the line with a tight-range etapa (range=2 < 0.4*15=6).
    server.use(
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
                  pesoMinimo: 14,
                  pesoIdeal: 15,
                  pesoMaximo: 16,
                  cantidadMuestrasRequeridas: 2,
                },
              ],
            },
          },
        });
      })
    );

    // Far from ideal: pesoNeto=25 → tolerance=10 > threshold=3 → blocked.
    vi.mocked(useBalanzaWebSocket).mockReturnValue({
      pesoNeto: 25.0,
      isConnected: true,
      hardwareId: undefined,
      unidad: undefined,
    });

    let muestraPosted = false;
    server.use(
      http.post(`${BASE}/muestras`, () => {
        muestraPosted = true;
        return HttpResponse.json({
          success: true,
          data: { id: 50, pesoNeto: 25, estadoValidacion: 'ok', usuarioId: 3, etapaId: 1, lineaProduccionId: 1, timestamp: '2026-06-23T20:00:00Z' },
        });
      })
    );

    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    expect((await screen.findAllByText('Amasado'))[0]).toBeInTheDocument();

    const btnRegistrar = screen.getByRole('button', { name: /registrar muestra/i });
    // Button stays clickable (NOT disabled) — gray appearance, not the success green.
    expect(btnRegistrar).not.toBeDisabled();
    expect(btnRegistrar.className).not.toContain('bg-success');
    expect(btnRegistrar.className).toContain('bg-muted');

    await userEvent.click(btnRegistrar);

    // alertWarning popup appears with an Aceptar button.
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByRole('button', { name: 'Aceptar' })).toBeInTheDocument();

    // addSample was NOT called — the guard short-circuited.
    expect(muestraPosted).toBe(false);
  });

  it('muestra el PasadaBlock (numero de pasada + hora de inicio) en el panel de muestras', async () => {    server.use(
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

  it('aplica la proporción de columnas 860:340 en el grid principal (no 50/50)', async () => {
    const { container } = renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    // Wait for the workspace to load
    expect((await screen.findAllByText('Amasado'))[0]).toBeInTheDocument();

    const grid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-\\[860fr_340fr\\]');
    expect(grid).not.toBeNull();
    expect(container.querySelector('.lg\\:grid-cols-2')).toBeNull();
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

  // ── Delete regresses the derived stage (refetch-driven, no optimistic filter) ──

  it('al eliminar una muestra se invalida la query de muestras y el conteo se recalcula tras el refetch', async () => {
    let currentMuestras = [
      { id: 50, pesoNeto: 15, estadoValidacion: 'ok' as const, usuarioId: 3, etapaId: 1, lineaProduccionId: 1, timestamp: '2026-06-23T19:00:00Z', observacion: '' },
    ];

    server.use(
      http.get(`${BASE}/muestras`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('pasadaId') === '101') {
          return HttpResponse.json({ success: true, data: currentMuestras });
        }
        return HttpResponse.json({ success: true, data: [] });
      }),
      http.delete(`${BASE}/muestras/:id`, ({ params }) => {
        currentMuestras = currentMuestras.filter((m) => m.id !== Number(params.id));
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    // Stage 1 (Amasado, requires 2) starts with 1 OK sample.
    expect(await screen.findByText('1 / 2 muestras OK')).toBeInTheDocument();

    // Open the sample popup and delete the sample.
    const row = (await screen.findAllByText('15.000 kg')).map((el) => el.closest('li')).find(Boolean)!;
    await userEvent.click(row);
    await screen.findByText(/Muestra #1/);
    await userEvent.click(screen.getByRole('button', { name: /eliminar muestra/i }));

    const confirmDialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));

    // Deletion is refetch-driven, not optimistic: the query is invalidated
    // and the count comes back from the server's post-delete truth.
    await waitFor(() => {
      expect(screen.getByText('0 / 2 muestras OK')).toBeInTheDocument();
    });
  });

  // ── Stage-advance flash overlay (forward-only, silent on regression) ────────

  it('muestra el overlay StageAdvanceFlash al completar una etapa y avanzar automáticamente a la siguiente', async () => {
    // Etapa 1 (Amasado, requires 2) starts with 1 OK sample already registered.
    server.use(
      http.get(`${BASE}/muestras`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('pasadaId') === '101') {
          return HttpResponse.json({
            success: true,
            data: [
              { id: 1, pesoNeto: 15, estadoValidacion: 'ok', usuarioId: 3, etapaId: 1, lineaProduccionId: 1, timestamp: '2026-06-23T19:00:00Z' },
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

    expect(await screen.findByText('1 / 2 muestras OK')).toBeInTheDocument();
    // No flash on initial mount — there is no prior active etapa to compare against.
    expect(screen.queryByTestId('stage-advance-flash')).not.toBeInTheDocument();

    // Registering the 2nd OK sample satisfies etapa 1 while the operator is on
    // screen — this is a live forward transition, so the flash must appear.
    const btnRegistrar = screen.getByRole('button', { name: /registrar muestra/i });
    await userEvent.click(btnRegistrar);

    expect(await screen.findByTestId('stage-advance-flash')).toBeInTheDocument();
    expect(await screen.findAllByText('Horneado')).not.toHaveLength(0);
  });

  it('NO muestra el overlay StageAdvanceFlash cuando un delete reduce el conteo pero la etapa activa no cambia', async () => {
    // Delete is UI-scoped to the current active etapa's own samples (spec:
    // "Delete scope stays limited to current stage"), so the only regression
    // reachable through this flow is a same-stage count drop — the active
    // etapa id itself does not change, so useStageAdvanceSignal must report
    // 'none' and the flash must never appear.
    let currentMuestras = [
      { id: 50, pesoNeto: 15, estadoValidacion: 'ok' as const, usuarioId: 3, etapaId: 1, lineaProduccionId: 1, timestamp: '2026-06-23T19:00:00Z', observacion: '' },
    ];

    server.use(
      http.get(`${BASE}/muestras`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('pasadaId') === '101') {
          return HttpResponse.json({ success: true, data: currentMuestras });
        }
        return HttpResponse.json({ success: true, data: [] });
      }),
      http.delete(`${BASE}/muestras/:id`, ({ params }) => {
        currentMuestras = currentMuestras.filter((m) => m.id !== Number(params.id));
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderWithAuth(<TabletWorkspace />, {
      user: operarioUser,
      activeLineaId: 1,
      initialEntries: ['/tablet?pasadaId=101'],
    });

    expect(await screen.findByText('1 / 2 muestras OK')).toBeInTheDocument();
    expect(screen.queryByTestId('stage-advance-flash')).not.toBeInTheDocument();

    const row = (await screen.findAllByText('15.000 kg')).map((el) => el.closest('li')).find(Boolean)!;
    await userEvent.click(row);
    await screen.findByText(/Muestra #1/);
    await userEvent.click(screen.getByRole('button', { name: /eliminar muestra/i }));

    const confirmDialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(screen.getByText('0 / 2 muestras OK')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('stage-advance-flash')).not.toBeInTheDocument();
  });

  it('muestra una alerta y redirige a /tablet/pasadas cuando la pasada es abortada por un admin', async () => {
    server.use(
      http.get(`${BASE}/pasadas/101`, () => {
        return HttpResponse.json({
          success: true,
          data: {
            id: 101,
            lineaProduccionId: 1,
            usuarioId: 3,
            estado: 'abortada',
            articuloId: 1,
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

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Pasada abortada')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Esta pasada fue abortada por un administrador.')
    ).toBeInTheDocument();

    expect(navigateMock).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Aceptar' }));

    expect(navigateMock).toHaveBeenCalledWith('/tablet/pasadas', { replace: true });
  });
});
