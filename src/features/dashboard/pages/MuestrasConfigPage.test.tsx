import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { MuestrasConfigPage } from './MuestrasConfigPage';
import { Toaster } from '../../../components/ui/sonner';
import { ThemeProvider } from '../../theme/ThemeContext';
import { TOLERANCE_QUERY_KEY } from '../../../hooks/useToleranceConfig';
import type { ToleranciaConfig } from '../../../api/tolerancia';

const URL = 'http://localhost:3000/api/configuracion/tolerancia';

// Local-time date so the formatted output does not depend on the runner timezone.
const UPDATED_AT = new Date(2026, 8, 29, 14, 5).toISOString();

const anaConfig: ToleranciaConfig = {
  toleranciaPct: 20,
  updatedAt: UPDATED_AT,
  updatedBy: { id: 7, nombreUsuario: 'aperez', nombreApellido: 'Ana Perez' },
};

const server = setupServer();

/** Stateful backend double: PUT mutates what later GETs return (refetch after save). */
function useBackend(initial: ToleranciaConfig, opts: { putStatus?: number } = {}) {
  let current = initial;
  const puts: unknown[] = [];
  server.use(
    http.get(URL, () => HttpResponse.json({ success: true, data: current })),
    http.put(URL, async ({ request }) => {
      const body = (await request.json()) as { toleranciaPct: number };
      puts.push(body);
      if (opts.putStatus && opts.putStatus >= 400) {
        return HttpResponse.json({ success: false }, { status: opts.putStatus });
      }
      current = {
        toleranciaPct: body.toleranciaPct,
        updatedAt: new Date(2026, 8, 30, 9, 30).toISOString(),
        updatedBy: { id: 1, nombreUsuario: 'admin', nombreApellido: 'Admin Istrador' },
      };
      return HttpResponse.json({ success: true, data: current });
    }),
  );
  return { puts };
}

function renderPage(ui: ReactNode = <MuestrasConfigPage />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const setQueryData = vi.spyOn(client, 'setQueryData');
  const invalidateQueries = vi.spyOn(client, 'invalidateQueries');
  render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter>{ui}</MemoryRouter>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { client, setQueryData, invalidateQueries };
}

async function findInput() {
  return (await screen.findByLabelText(/tolerancia de peso/i)) as HTMLInputElement;
}

describe('MuestrasConfigPage', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('shows the current value, the last-change user and the formatted timestamp', async () => {
    useBackend(anaConfig);
    renderPage();

    const input = await findInput();
    expect(input.value).toBe('20');
    expect(screen.getByTestId('current-tolerance')).toHaveTextContent('20%');
    expect(screen.getByText(/Ana Perez/)).toBeInTheDocument();
    expect(screen.getByText(/29\/09\/2026.*14:05/)).toBeInTheDocument();
    expect(screen.queryByText('Valor inicial del sistema')).not.toBeInTheDocument();
  });

  it('shows "Valor inicial del sistema" when there is no updating user', async () => {
    useBackend({ ...anaConfig, updatedBy: null });
    renderPage();

    await findInput();
    expect(screen.getByText('Valor inicial del sistema')).toBeInTheDocument();
    expect(screen.queryByText(/Ana Perez/)).not.toBeInTheDocument();
  });

  it('shows an error and no editing controls when loading fails', async () => {
    server.use(http.get(URL, () => HttpResponse.json({ success: false }, { status: 500 })));
    renderPage();

    expect(await screen.findByText(/No se pudo cargar la tolerancia/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/tolerancia de peso/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
  });

  it.each([
    ['51', '51'],
    ['-1', '-1'],
  ])('rejects %s with a visible message, disabled Save and no PUT', async (_label, typed) => {
    const { puts } = useBackend(anaConfig);
    const user = userEvent.setup();
    renderPage();

    const input = await findInput();
    await user.clear(input);
    await user.type(input, typed);

    expect(screen.getByText(/entre 0 y 50/i)).toBeInTheDocument();
    const save = screen.getByRole('button', { name: /guardar/i });
    expect(save).toBeDisabled();
    await user.click(save);
    expect(puts).toHaveLength(0);
  });

  it('rejects an empty value with a visible message and no PUT', async () => {
    const { puts } = useBackend(anaConfig);
    const user = userEvent.setup();
    renderPage();

    const input = await findInput();
    await user.clear(input);

    expect(screen.getByText(/entre 0 y 50/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled();
    expect(puts).toHaveLength(0);
  });

  it.each(['0', '50', '12.5'])('accepts %s (Save enabled, no message)', async (typed) => {
    useBackend(anaConfig);
    const user = userEvent.setup();
    renderPage();

    const input = await findInput();
    await user.clear(input);
    await user.type(input, typed);

    expect(screen.queryByText(/entre 0 y 50/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeEnabled();
  });

  it('keeps Save disabled while the value is unchanged', async () => {
    useBackend(anaConfig);
    renderPage();

    await findInput();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled();
  });

  it('saves a number, confirms, updates the audit info and refreshes the shared query', async () => {
    const { puts } = useBackend(anaConfig);
    const user = userEvent.setup();
    const { setQueryData, invalidateQueries } = renderPage();

    const input = await findInput();
    await user.clear(input);
    await user.type(input, '30');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText('Tolerancia actualizada')).toBeInTheDocument();
    expect(puts).toEqual([{ toleranciaPct: 30 }]);
    expect(typeof (puts[0] as { toleranciaPct: unknown }).toleranciaPct).toBe('number');

    await waitFor(() => expect(screen.getByTestId('current-tolerance')).toHaveTextContent('30%'));
    expect(screen.getByText(/Admin Istrador/)).toBeInTheDocument();
    expect(screen.getByText(/30\/09\/2026.*09:30/)).toBeInTheDocument();
    expect(screen.queryByText(/Ana Perez/)).not.toBeInTheDocument();

    expect(setQueryData).toHaveBeenCalledWith(
      TOLERANCE_QUERY_KEY,
      expect.objectContaining({ toleranciaPct: 30 }),
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: TOLERANCE_QUERY_KEY }),
    );
  });

  it('shows an error toast on PUT failure and keeps the stored value as current', async () => {
    const { puts } = useBackend(anaConfig, { putStatus: 500 });
    const user = userEvent.setup();
    renderPage();

    const input = await findInput();
    await user.clear(input);
    await user.type(input, '30');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText('No se pudo guardar la tolerancia')).toBeInTheDocument();
    expect(puts).toEqual([{ toleranciaPct: 30 }]);
    expect(screen.getByTestId('current-tolerance')).toHaveTextContent('20%');
    expect(screen.getByText(/Ana Perez/)).toBeInTheDocument();
  });

  it('updates the preview with the entered value without saving', async () => {
    const { puts } = useBackend(anaConfig);
    const user = userEvent.setup();
    renderPage();

    const input = await findInput();
    expect(
      screen.getByText('Se bloquea el registro por debajo de 72 y por encima de 132'),
    ).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, '40');

    expect(
      screen.getByText('Se bloquea el registro por debajo de 54 y por encima de 154'),
    ).toBeInTheDocument();
    expect(puts).toHaveLength(0);
  });

  it('does not overwrite an in-progress edit when the query refetches', async () => {
    useBackend(anaConfig);
    const user = userEvent.setup();
    const { client } = renderPage();

    const input = await findInput();
    await user.clear(input);
    await user.type(input, '35');
    await client.refetchQueries({ queryKey: TOLERANCE_QUERY_KEY });

    expect(input.value).toBe('35');
  });
});
