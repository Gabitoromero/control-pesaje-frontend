import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';
import { handlers, pagedJson, lineasMock } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { LineasPage } from './LineasPage';
import { useActividadGlobal } from '../hooks/useActividadGlobal';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());

// jsdom has no Element.animate; the "missing field" pulse is observed through this spy.
const animateSpy = vi.fn();
beforeEach(() => {
  animateSpy.mockClear();
  (Element.prototype as unknown as { animate: unknown }).animate = animateSpy;
});
afterEach(() => {
  delete (Element.prototype as unknown as { animate?: unknown }).animate;
});
/** data-field names of the elements that were pulsed so far. */
const pulsedFields = () =>
  animateSpy.mock.contexts.map((el) => (el as HTMLElement).dataset.field).filter(Boolean);
afterAll(() => server.close());

// The form is a single column of labelled fields (Nombre, Balanza, Ruta Activa,
// Artículo, Dispositivo, Observación). Comboboxes are targeted by their field label
// so reordering fields never silently changes which one a test interacts with.
const selectComboboxOption = async (fieldLabel: RegExp | string, optionName: string) => {
  const label = screen.getByText(fieldLabel, { selector: 'label' });
  const trigger = within(label.parentElement as HTMLElement).getAllByRole('button')[0];
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole('option', { name: optionName }));
};

describe('LineasPage', () => {
  it('asks for one bounded page of rutas when the ruta selector opens, never the whole catalog', async () => {
    const urls: URL[] = [];
    server.use(
      http.get('http://localhost:3000/api/rutas-pasadas', ({ request }) => {
        urls.push(new URL(request.url));
        return pagedJson(request, [{ id: 1, nombre: 'Ruta Alpha', activo: true }]);
      })
    );
    renderWithProviders(<LineasPage />);
    await screen.findByText('Línea 1 — Envasado A');
    await userEvent.click(screen.getByRole('button', { name: /Nueva Línea/ }));

    const label = await screen.findByText(/Ruta Activa/, { selector: 'label' });
    expect(urls).toHaveLength(0);
    await userEvent.click(within(label.parentElement as HTMLElement).getAllByRole('button')[0]);

    expect(await screen.findByRole('option', { name: 'Ruta Alpha' })).toBeInTheDocument();
    expect(urls).toHaveLength(1);
    expect(urls[0].searchParams.get('pageSize')).toBe('20');
    expect(urls[0].searchParams.get('page')).toBe('1');
  });

  it('default mount shows only activos', async () => {
    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    expect(screen.getByText('Línea 2 — Envasado B')).toBeInTheDocument();
    expect(screen.getByText('Línea 3 — Fraccionado')).toBeInTheDocument();

    expect(screen.queryByText('Línea 4 — Inactiva A')).not.toBeInTheDocument();
    expect(screen.queryByText('Línea 5 — Inactiva B')).not.toBeInTheDocument();
  });

  it('wraps the table in a horizontal-scroll container so narrow viewports scroll instead of breaking the layout', async () => {
    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const scrollWrapper = table.parentElement as HTMLElement;
    expect(scrollWrapper.className).toMatch(/overflow-x-auto/);
  });

  it('switching to inactivos shows only inactivos', async () => {
    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Línea 4 — Inactiva A')).toBeInTheDocument();
    });

    expect(screen.getByText('Línea 4 — Inactiva A')).toBeInTheDocument();
    expect(screen.getByText('Línea 5 — Inactiva B')).toBeInTheDocument();

    expect(screen.queryByText('Línea 1 — Envasado A')).not.toBeInTheDocument();
    expect(screen.queryByText('Línea 2 — Envasado B')).not.toBeInTheDocument();
    expect(screen.queryByText('Línea 3 — Fraccionado')).not.toBeInTheDocument();
  });

  it('typing search text filters activos by nombre; clearing restores full list', async () => {
    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar...');

    await userEvent.type(searchInput, 'envasado a');

    expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Línea 2 — Envasado B')).not.toBeInTheDocument());
    expect(screen.queryByText('Línea 3 — Fraccionado')).not.toBeInTheDocument();

    await userEvent.clear(searchInput);

    expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    expect(await screen.findByText('Línea 2 — Envasado B')).toBeInTheDocument();
    expect(screen.getByText('Línea 3 — Fraccionado')).toBeInTheDocument();
  });

  it('"Activar Línea" button is visible when editing an inactive linea', async () => {
    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Línea 4 — Inactiva A')).toBeInTheDocument();
    });

    const lineaText = await screen.findByText('Línea 4 — Inactiva A');
    const lineaRow = lineaText.closest('tr')!;
    await userEvent.click(within(lineaRow).getByTitle('Editar'));

    expect(screen.getByRole('heading', { name: 'Editar Línea' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activar Línea' })).toBeInTheDocument();
  });

  it('"Activar Línea" button is NOT visible when editing an active linea', async () => {
    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const lineaText = await screen.findByText('Línea 1 — Envasado A');
    const lineaRow = lineaText.closest('tr')!;
    await userEvent.click(within(lineaRow).getByTitle('Editar'));

    expect(screen.getByRole('heading', { name: 'Editar Línea' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Activar Línea' })).not.toBeInTheDocument();
  });

  it('clicking "Activar Línea" sends PUT with activo:true; modal closes on success', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/lineas-produccion/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 4, ...(requestPayload as object) } });
      })
    );

    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Línea 4 — Inactiva A')).toBeInTheDocument();
    });

    const lineaText = await screen.findByText('Línea 4 — Inactiva A');
    const lineaRow = lineaText.closest('tr')!;
    await userEvent.click(within(lineaRow).getByTitle('Editar'));

    await userEvent.click(screen.getByRole('button', { name: 'Activar Línea' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).activo).toBe(true);
      expect(screen.queryByRole('heading', { name: 'Editar Línea' })).not.toBeInTheDocument();
    });
  });

  it('clicking "Activar Línea" shows an "activada" success dialog, not the generic "actualizada" copy', async () => {
    server.use(
      http.put('http://localhost:3000/api/lineas-produccion/:id', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ success: true, data: { id: 4, ...(body as object) } });
      })
    );

    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Línea 4 — Inactiva A')).toBeInTheDocument();
    });

    const lineaText = await screen.findByText('Línea 4 — Inactiva A');
    const lineaRow = lineaText.closest('tr')!;
    await userEvent.click(within(lineaRow).getByTitle('Editar'));

    // Línea 4 already has idBalanza/articuloId from the mock, so only Dispositivo
    // and Ruta Activa remain unselected. Assign a ruta activa before activating so
    // this hits the "success" branch, not the "no ruta" warning branch.
    await selectComboboxOption(/^Ruta Activa/, 'Ruta Alpha');

    await userEvent.click(screen.getByRole('button', { name: 'Activar Línea' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Línea activada exitosamente')).toBeInTheDocument();
    expect(within(dialog).queryByText('Línea actualizada exitosamente')).not.toBeInTheDocument();
  });

  it('editing and clearing rutaPasadaActiva on an active linea sends PUT with rutaPasadaActiva: null', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/lineas-produccion/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 1, ...(requestPayload as object) } });
      })
    );

    // Override lineasMock GET to return a linea with rutaPasadaActiva set
    server.use(
      http.get('http://localhost:3000/api/lineas-produccion', ({ request }) =>
        pagedJson(request, [
            { id: 1, nombre: 'Línea 1 — Envasado A', estado: 'disponible', activo: true, numeroBalanza: 1, rutaPasadaActiva: 1, idBalanza: 1, articuloId: 1 },
            ...lineasMock.slice(1),
          ])
      )
    );

    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const lineaText = await screen.findByText('Línea 1 — Envasado A');
    const lineaRow = lineaText.closest('tr')!;
    await userEvent.click(within(lineaRow).getByTitle('Editar'));

    // rutaPasadaActiva form field starts empty because the mock returns a number (not object)
    // — no clearing necessary. Just save to send null.
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).rutaPasadaActiva).toBeNull();
    });
  });

  it('editing and clearing rutaPasadaActiva on an inactive linea sends PUT with rutaPasadaActiva: null', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/lineas-produccion/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 4, ...(requestPayload as object) } });
      })
    );

    // Override inactive GET to include a rutaPasadaActiva
    server.use(
      http.get('http://localhost:3000/api/lineas-produccion/inactive', ({ request }) =>
        pagedJson(request, [
            { id: 4, nombre: 'Línea 4 — Inactiva A', activo: false, numeroBalanza: 4, rutaPasadaActiva: 1, idBalanza: 1, articuloId: 1 },
            { id: 5, nombre: 'Línea 5 — Inactiva B', activo: false, numeroBalanza: 5, idBalanza: 2, articuloId: 2 },
          ])
      )
    );

    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Línea 4 — Inactiva A')).toBeInTheDocument();
    });

    const lineaText = await screen.findByText('Línea 4 — Inactiva A');
    const lineaRow = lineaText.closest('tr')!;
    await userEvent.click(within(lineaRow).getByTitle('Editar'));

    // rutaPasadaActiva form field starts empty because the mock returns a number (not object)
    // — no clearing necessary. Just save to send null.
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).rutaPasadaActiva).toBeNull();
    });
  });

  describe('delete confirm dialog (replaces window.confirm)', () => {
    it('clicking "Eliminar Línea" opens a confirm dialog instead of window.confirm', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm');

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: /eliminar línea/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      expect(confirmDialog).toHaveAccessibleName('¿Está seguro de eliminar esta línea?');
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('confirming the delete dialog sends the DELETE request and closes both dialogs', async () => {
      let deleteRequested = false;
      server.use(
        http.delete('http://localhost:3000/api/lineas-produccion/:id', () => {
          deleteRequested = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: /eliminar línea/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));

      await waitFor(() => {
        expect(deleteRequested).toBe(true);
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Editar Línea' })).not.toBeInTheDocument();
      });
    });

    it('cancelling the delete dialog does NOT send a DELETE request and keeps the edit modal open', async () => {
      let deleteRequested = false;
      server.use(
        http.delete('http://localhost:3000/api/lineas-produccion/:id', () => {
          deleteRequested = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: /eliminar línea/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Cancelar' }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
      expect(deleteRequested).toBe(false);
      expect(screen.getByRole('heading', { name: 'Editar Línea' })).toBeInTheDocument();
    });
  });

  describe('error dialogs on mutation failure (replaces window.alert)', () => {
    it('create failure shows an alertdialog titled "No se pudo crear la línea"', async () => {
      server.use(
        http.post('http://localhost:3000/api/lineas-produccion', () =>
          HttpResponse.json({ success: false, error: { message: 'Balanza ya en uso' } }, { status: 400 })
        )
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));
      await userEvent.type(screen.getByLabelText('Nombre'), 'Línea Nueva');
      await selectComboboxOption('Balanza', 'Balanza 1');
      await selectComboboxOption('Artículo', '[Harina 000] MarcaA');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      const dialog = await screen.findByText('No se pudo crear la línea');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('Balanza ya en uso')).toBeInTheDocument();
    });

    it('update failure shows an alertdialog titled "No se pudo guardar la línea"', async () => {
      server.use(
        http.put('http://localhost:3000/api/lineas-produccion/:id', () =>
          HttpResponse.json({ success: false, error: { message: 'No se pudo actualizar' } }, { status: 400 })
        )
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      await screen.findByText('No se pudo guardar la línea');
      expect(screen.getByText('No se pudo actualizar')).toBeInTheDocument();
    });

    it('delete failure shows an alertdialog titled "No se pudo eliminar la línea"', async () => {
      server.use(
        http.delete('http://localhost:3000/api/lineas-produccion/:id', () =>
          HttpResponse.json({ success: false, error: { message: 'En uso' } }, { status: 409 })
        )
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: /eliminar línea/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));

      await screen.findByText('No se pudo eliminar la línea');
      expect(screen.getByText('En uso')).toBeInTheDocument();
    });
  });

  describe('success/warning dialog after mutation', () => {
    it('shows a success alertdialog after creating a línea with a ruta activa assigned', async () => {
      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));

      await userEvent.type(screen.getByLabelText('Nombre'), 'Línea Nueva');
      await selectComboboxOption('Balanza', 'Balanza 1');
      await selectComboboxOption('Artículo', '[Harina 000] MarcaA');
      // Ruta Activa is now the last unselected combobox (Dispositivo before it stays empty)
      await selectComboboxOption(/^Ruta Activa/, 'Ruta Alpha');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('Línea creada exitosamente')).toBeInTheDocument();

      await userEvent.click(within(dialog).getByRole('button', { name: 'Aceptar' }));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('shows a warning alertdialog after creating a línea without a ruta activa assigned', async () => {
      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));

      await userEvent.type(screen.getByLabelText('Nombre'), 'Línea Sin Ruta');
      await selectComboboxOption('Balanza', 'Balanza 1');
      await selectComboboxOption('Artículo', '[Harina 000] MarcaA');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('Línea creada sin ruta activa')).toBeInTheDocument();
      expect(
        within(dialog).getByText(
          'La línea fue guardada correctamente, pero no tiene una ruta de pasada activa asignada.'
        )
      ).toBeInTheDocument();
    });

    it('shows a success alertdialog after updating a línea that keeps a ruta activa assigned', async () => {
      server.use(
        http.get('http://localhost:3000/api/lineas-produccion', ({ request }) =>
          pagedJson(request, [
              { id: 1, nombre: 'Línea 1 — Envasado A', estado: 'disponible', activo: true, numeroBalanza: 1, rutaPasadaActiva: { id: 1, nombre: 'Ruta Alpha' }, idBalanza: 1, articuloId: 1 },
              ...lineasMock.slice(1),
            ])
        )
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('Línea actualizada exitosamente')).toBeInTheDocument();
    });
  });

  describe('required Balanza + Articulo selectors (Phase 3)', () => {
    it('renders Balanza and Articulo selectors in the create form', async () => {
      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));

      expect(screen.getByText('Balanza')).toBeInTheDocument();
      expect(screen.getByText('Artículo')).toBeInTheDocument();
    });


    it('Guardar is never disabled by missing fields; submitting without artículo pulses the artículo field and sends nothing', async () => {
      let posted = false;
      server.use(
        http.post('http://localhost:3000/api/lineas-produccion', () => {
          posted = true;
          return HttpResponse.json({ success: true, data: { id: 99 } });
        })
      );
      renderWithProviders(<LineasPage />);
      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));
      await userEvent.type(screen.getByLabelText('Nombre'), 'Línea Nueva');
      await selectComboboxOption('Balanza', 'Balanza 1');

      expect(pulsedFields()).not.toContain('articuloId');
      const guardar = screen.getByRole('button', { name: 'Guardar' });
      expect(guardar).toBeEnabled();

      await userEvent.click(guardar);

      await waitFor(() => expect(pulsedFields()).toContain('articuloId'));
      expect(pulsedFields()).not.toContain('idBalanza');
      expect(posted).toBe(false);
    });

    it('submitting without balanza pulses the Balanza field and sends nothing', async () => {
      let posted = false;
      server.use(
        http.post('http://localhost:3000/api/lineas-produccion', () => {
          posted = true;
          return HttpResponse.json({ success: true, data: { id: 99 } });
        })
      );
      renderWithProviders(<LineasPage />);
      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));
      await userEvent.type(screen.getByLabelText('Nombre'), 'Línea Nueva');
      await selectComboboxOption('Artículo', '[Harina 000] MarcaA');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      await waitFor(() => expect(pulsedFields()).toContain('idBalanza'));
      expect(pulsedFields()).not.toContain('articuloId');
      expect(posted).toBe(false);
    });

    it('creating a línea sends idBalanza and articuloId in the payload', async () => {
      let requestPayload: unknown = null;
      server.use(
        http.post('http://localhost:3000/api/lineas-produccion', async ({ request }) => {
          requestPayload = await request.json();
          return HttpResponse.json({ success: true, data: { id: 99, ...(requestPayload as object) } }, { status: 201 });
        })
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));
      await userEvent.type(screen.getByLabelText('Nombre'), 'Línea Nueva');
      await selectComboboxOption('Balanza', 'Balanza 2');
      await selectComboboxOption('Artículo', '[Azúcar] MarcaB');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      await waitFor(() => {
        expect((requestPayload as Record<string, unknown>).idBalanza).toBe(2);
        expect((requestPayload as Record<string, unknown>).articuloId).toBe(2);
      });
    });

    it('editing a línea sends the updated idBalanza and articuloId in the payload', async () => {
      let requestPayload: unknown = null;
      server.use(
        http.put('http://localhost:3000/api/lineas-produccion/:id', async ({ request }) => {
          requestPayload = await request.json();
          return HttpResponse.json({ success: true, data: { id: 1, ...(requestPayload as object) } });
        })
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      // Línea 1 starts with Balanza 1 / Harina 000 (id 1) from the mock; change the balanza.
      await userEvent.click(screen.getByRole('button', { name: 'Balanza 1' }));
      await userEvent.click(screen.getByRole('option', { name: 'Balanza 2' }));

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      await waitFor(() => {
        expect((requestPayload as Record<string, unknown>).idBalanza).toBe(2);
        expect((requestPayload as Record<string, unknown>).articuloId).toBe(1);
      });
    });

    it('creating a línea sends the typed observación in the payload', async () => {
      let requestPayload: unknown = null;
      server.use(
        http.post('http://localhost:3000/api/lineas-produccion', async ({ request }) => {
          requestPayload = await request.json();
          return HttpResponse.json({ success: true, data: { id: 99, ...(requestPayload as object) } }, { status: 201 });
        })
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));
      await userEvent.type(screen.getByLabelText('Nombre'), 'Línea Nueva');
      await selectComboboxOption('Balanza', 'Balanza 2');
      await selectComboboxOption('Artículo', '[Azúcar] MarcaB');
      await userEvent.type(screen.getByLabelText(/observación/i), 'Línea reservada para temporada');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      await waitFor(() => {
        expect((requestPayload as Record<string, unknown>).observacion).toBe('Línea reservada para temporada');
      });
    });

    it('creating a línea with a blank observación omits the key entirely (backend rejects "")', async () => {
      let requestPayload: unknown = null;
      server.use(
        http.post('http://localhost:3000/api/lineas-produccion', async ({ request }) => {
          requestPayload = await request.json();
          return HttpResponse.json({ success: true, data: { id: 99, ...(requestPayload as object) } }, { status: 201 });
        })
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));
      await userEvent.type(screen.getByLabelText('Nombre'), 'Línea Sin Observación');
      await selectComboboxOption('Balanza', 'Balanza 1');
      await selectComboboxOption('Artículo', '[Harina 000] MarcaA');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      await waitFor(() => {
        expect(requestPayload).not.toBeNull();
      });
      expect(requestPayload).not.toHaveProperty('observacion');
    });

    it('clearing an existing observación on edit sends observacion: null', async () => {
      let requestPayload: unknown = null;
      server.use(
        http.put('http://localhost:3000/api/lineas-produccion/:id', async ({ request }) => {
          requestPayload = await request.json();
          return HttpResponse.json({ success: true, data: { id: 1, ...(requestPayload as object) } });
        })
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      const observacionField = screen.getByLabelText(/observación/i);
      await userEvent.clear(observacionField);
      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      await waitFor(() => {
        expect((requestPayload as Record<string, unknown>).observacion).toBeNull();
      });
    });

    it('empty balanza catalog shows an empty state with a link to the Balanza catalog page and blocks submission', async () => {
      let posted = false;
      server.use(
        http.post('http://localhost:3000/api/lineas-produccion', () => {
          posted = true;
          return HttpResponse.json({ success: true, data: { id: 99 } });
        }),
        http.get('http://localhost:3000/api/balanzas', () =>
          HttpResponse.json({ success: true, data: [] })
        )
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));

      await waitFor(() => {
        expect(screen.getByText(/no hay balanzas activas/i)).toBeInTheDocument();
      });

      const link = screen.getByRole('link', { name: /ir al catálogo de balanzas/i });
      expect(link).toHaveAttribute('href', '/dashboard/balanzas');

      // Guardar stays clickable, but without a balanza nothing is sent.
      await userEvent.type(screen.getByLabelText('Nombre'), 'Línea Nueva');
      await selectComboboxOption('Artículo', '[Harina 000] MarcaA');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
      expect(posted).toBe(false);
      // The empty state is the "Balanza field" here, so it is the one that gets pulsed.
      await waitFor(() => expect(pulsedFields()).toContain('idBalanza'));
    });
  });

  describe('línea form: ruta before artículo, artículos filtered by ruta', () => {
    const openCreateForm = async () => {
      renderWithProviders(<LineasPage />);
      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));
    };

    it('lists Ruta Activa before Artículo, and optional fields last', async () => {
      await openCreateForm();

      const labels = Array.from(document.querySelectorAll('form label')).map((l) => l.textContent ?? '');
      const idx = (re: RegExp) => labels.findIndex((t) => re.test(t));

      expect(idx(/^Nombre/)).toBeLessThan(idx(/^Balanza/));
      expect(idx(/^Balanza/)).toBeLessThan(idx(/^Ruta Activa/));
      expect(idx(/^Ruta Activa/)).toBeLessThan(idx(/^Artículo/));
      expect(idx(/^Artículo/)).toBeLessThan(idx(/^Dispositivo/));
      expect(idx(/^Dispositivo/)).toBeLessThan(idx(/^Observación/));
    });

    it('without a ruta, every artículo is offered and the help text says so', async () => {
      await openCreateForm();

      expect(screen.getByText(/sin ruta.*todos los artículos/i)).toBeInTheDocument();
      await userEvent.click(within(screen.getByText('Artículo', { selector: 'label' }).parentElement as HTMLElement).getAllByRole('button')[0]);
      expect(screen.getByRole('option', { name: '[Harina 000] MarcaA' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '[Sal fina] MarcaC' })).toBeInTheDocument();
    });

    it('with a ruta selected, only the artículos of that ruta are offered', async () => {
      await openCreateForm();

      await selectComboboxOption(/^Ruta Activa/, 'Ruta Alpha');

      expect(await screen.findByText(/solo.*artículos de la ruta/i)).toBeInTheDocument();
      await waitFor(async () => {
        const field = screen.getByText('Artículo', { selector: 'label' }).parentElement as HTMLElement;
        await userEvent.click(within(field).getAllByRole('button')[0]);
        expect(screen.getByRole('option', { name: '[Harina 000] MarcaA' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '[Azúcar] MarcaB' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: '[Sal fina] MarcaC' })).not.toBeInTheDocument();
      });
    });

    it('changing to a ruta that does not contain the selected artículo clears it', async () => {
      await openCreateForm();

      await selectComboboxOption('Artículo', '[Sal fina] MarcaC');
      expect(screen.getByRole('button', { name: '[Sal fina] MarcaC' })).toBeInTheDocument();

      await selectComboboxOption(/^Ruta Activa/, 'Ruta Alpha');

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: '[Sal fina] MarcaC' })).not.toBeInTheDocument();
      });
      const articuloField = screen.getByText('Artículo', { selector: 'label' }).parentElement as HTMLElement;
      expect(within(articuloField).getByRole('button', { name: 'Seleccione...' })).toBeInTheDocument();
    });

    it('clearing the ruta also clears the artículo, which must then be picked again before saving', async () => {
      await openCreateForm();
      await userEvent.type(screen.getByLabelText('Nombre'), 'Línea Nueva');

      await selectComboboxOption('Balanza', 'Balanza 1');
      await selectComboboxOption(/^Ruta Activa/, 'Ruta Alpha');
      await selectComboboxOption('Artículo', '[Harina 000] MarcaA');

      const rutaField = screen.getByText(/^Ruta Activa/, { selector: 'label' }).parentElement as HTMLElement;
      // The icon-only clear (X) button is the second button of a clearable combobox.
      await userEvent.click(within(rutaField).getAllByRole('button')[1]);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: '[Harina 000] MarcaA' })).not.toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
      await waitFor(() => expect(pulsedFields()).toContain('articuloId'));
    });

    it('shows an error with a retry button when the artículos of the ruta cannot be loaded', async () => {
      let calls = 0;
      server.use(
        http.get('http://localhost:3000/api/rutas-pasadas-articulos', () => {
          calls += 1;
          return calls === 1
            ? HttpResponse.json({ success: false, error: { message: 'boom' } }, { status: 500 })
            : HttpResponse.json({
                success: true,
                data: [{ id: 101, articulo: { id: 1, codigo: 'Harina 000', nombre: 'MarcaA' } }],
              });
        })
      );
      await openCreateForm();

      await selectComboboxOption(/^Ruta Activa/, 'Ruta Alpha');

      expect(await screen.findByText(/no se pudieron cargar los artículos de la ruta/i)).toBeInTheDocument();
      expect(screen.queryByText(/cargando los artículos/i)).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /reintentar/i }));

      expect(await screen.findByText(/solo.*artículos de la ruta/i)).toBeInTheDocument();
      expect(screen.queryByText(/no se pudieron cargar/i)).not.toBeInTheDocument();
    });

    it('opening a línea whose artículo is not in its ruta shows the artículo as unselected', async () => {
      server.use(
        http.get('http://localhost:3000/api/lineas-produccion', ({ request }) =>
          pagedJson(request, [
              { id: 1, nombre: 'Línea 1 — Envasado A', estado: 'disponible', activo: true, numeroBalanza: 1, rutaPasadaActiva: { id: 1, nombre: 'Ruta Alpha' }, idBalanza: 1, articuloId: 3 },
              ...lineasMock.slice(1),
            ])
        )
      );
      renderWithProviders(<LineasPage />);
      const row = (await screen.findByText('Línea 1 — Envasado A')).closest('tr')!;
      await userEvent.click(within(row).getByTitle('Editar'));

      const articuloField = screen.getByText('Artículo', { selector: 'label' }).parentElement as HTMLElement;
      await waitFor(() => {
        expect(within(articuloField).getByRole('button', { name: 'Seleccione...' })).toBeInTheDocument();
      });
      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
      await waitFor(() => expect(pulsedFields()).toContain('articuloId'));
    });

    it('keeps the selected artículo when it belongs to the newly selected ruta', async () => {
      await openCreateForm();

      await selectComboboxOption('Artículo', '[Harina 000] MarcaA');
      await selectComboboxOption(/^Ruta Activa/, 'Ruta Alpha');

      await screen.findByText(/solo.*artículos de la ruta/i);
      expect(screen.getByRole('button', { name: '[Harina 000] MarcaA' })).toBeInTheDocument();
    });
  });

  describe('per-line activity lock', () => {
    const BLOCKED_TITLE = 'Línea con pasada o sesión activa: no se puede editar';
    const lockedState = (ids: number[]) => ({
      hayActividad: true,
      lineaIdsConActividad: new Set<number>(ids),
      pasadas: [],
      sesiones: [],
      isLoading: false,
    });

    afterEach(() => {
      vi.mocked(useActividadGlobal).mockReset();
    });

    const rowOf = async (name: string) =>
      (await screen.findByText(name)).closest('tr') as HTMLElement;

    it('locks only the Edit button and row of the busy line', async () => {
      vi.mocked(useActividadGlobal).mockReturnValue(lockedState([1]));
      renderWithProviders(<LineasPage />);

      const row1 = await rowOf('Línea 1 — Envasado A');
      expect(within(row1).getByTitle(BLOCKED_TITLE)).toBeDisabled();
      expect(row1.className).toContain('bg-warning/20');
      expect(row1.className).not.toContain('even:bg-muted/40');
      expect(row1.className).not.toContain('hover:bg-accent');
    });

    it('keeps other lines editable and opens the edit modal', async () => {
      vi.mocked(useActividadGlobal).mockReturnValue(lockedState([1]));
      renderWithProviders(<LineasPage />);

      const row2 = await rowOf('Línea 2 — Envasado B');
      const editBtn = within(row2).getByTitle('Editar');
      expect(editBtn).toBeEnabled();
      expect(row2.className).not.toContain('bg-warning/20');

      await userEvent.click(editBtn);
      expect(await screen.findByRole('heading', { name: 'Editar Línea' })).toBeInTheDocument();
    });

    it('keeps Nueva Línea disabled globally while there is activity', async () => {
      vi.mocked(useActividadGlobal).mockReturnValue(lockedState([1]));
      renderWithProviders(<LineasPage />);

      await rowOf('Línea 2 — Envasado B');
      const btn = screen.getByRole('button', { name: /nueva línea/i });
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute(
        'title',
        'No se pueden crear líneas mientras haya pasadas o sesiones activas',
      );
    });

    it('shows the reworded banner and not the old text', async () => {
      vi.mocked(useActividadGlobal).mockReturnValue(lockedState([1]));
      renderWithProviders(<LineasPage />);

      await rowOf('Línea 1 — Envasado A');
      expect(screen.getByText(/resaltadas en amarillo/i)).toBeInTheDocument();
      expect(screen.getByText(/Tampoco se pueden crear líneas nuevas/i)).toBeInTheDocument();
      expect(screen.queryByText(/No se permite crear, editar o eliminar líneas/i)).not.toBeInTheDocument();
    });

    it('locks a line that only has an active session', async () => {
      vi.mocked(useActividadGlobal).mockReturnValue(lockedState([3]));
      renderWithProviders(<LineasPage />);

      const row3 = await rowOf('Línea 3 — Fraccionado');
      expect(within(row3).getByTitle(BLOCKED_TITLE)).toBeDisabled();
      expect(row3.className).toContain('bg-warning/20');
    });

    it('with no activity shows no banner, enables Nueva Línea and every Edit', async () => {
      renderWithProviders(<LineasPage />);

      await rowOf('Línea 1 — Envasado A');
      expect(screen.queryByText(/resaltadas en amarillo/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Bloqueo de seguridad activo/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /nueva línea/i })).toBeEnabled();
      for (const btn of screen.getAllByTitle('Editar')) {
        expect(btn).toBeEnabled();
      }
    });

    it('unblocks the line when activity disappears', async () => {
      vi.mocked(useActividadGlobal).mockReturnValue(lockedState([1]));
      renderWithProviders(<LineasPage />);

      const row1 = await rowOf('Línea 1 — Envasado A');
      expect(within(row1).getByTitle(BLOCKED_TITLE)).toBeDisabled();

      // Simulate the next poll: the hook now reports no activity. Toggling the status
      // filter forces LineasPage to re-render and re-read the hook.
      vi.mocked(useActividadGlobal).mockReturnValue({ ...lockedState([]), hayActividad: false });
      const statusSelect = screen.getAllByRole('combobox')[0];
      await userEvent.selectOptions(statusSelect, 'inactivo');
      await userEvent.selectOptions(statusSelect, 'activo');

      const unlockedRow = await rowOf('Línea 1 — Envasado A');
      expect(within(unlockedRow).getByTitle('Editar')).toBeEnabled();
      expect(unlockedRow.className).not.toContain('bg-warning/20');
      expect(screen.queryByText(/resaltadas en amarillo/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /nueva línea/i })).toBeEnabled();
    });
  });
});
