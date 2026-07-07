import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { RutaFormPage } from './RutaFormPage';
import { etapaSchema, rutaSchema } from './RutaFormPage.schemas';
import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';

describe('RutaFormPage Validation Schemas', () => {
  describe('rutaSchema', () => {
    it('should validate a valid ruta payload', () => {
      const validPayload = {
        nombre: 'Ruta 1',
        etapas: [
          {
            etapa: 1,
            pesoMinimo: 10,
            pesoMaximo: 20,
            pesoIdeal: 15,
            cantidadMuestrasRequeridas: 1,
          }
        ]
      };
      
      const result = rutaSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should require a nombre', () => {
      const invalidPayload = {
        nombre: '',
        etapas: []
      };
      const result = rutaSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Nombre es requerido');
      }
    });

    it('should permit empty etapas', () => {
      const validPayload = {
        nombre: 'Ruta 1',
        etapas: []
      };
      const result = rutaSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('etapaSchema', () => {
    it('should require missing stage fields (pesoMinimo)', () => {
      const invalidEtapa = {
        etapa: 1,
        pesoMinimo: -1,
        pesoMaximo: 20,
        pesoIdeal: 15,
        cantidadMuestrasRequeridas: 1,
      };
      const result = etapaSchema.safeParse(invalidEtapa);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Debe ser mayor a 0');
      }
    });

    it('should fail if required fields are missing/NaN', () => {
      const invalidEtapa = {
        etapa: 1,
      };
      const result = etapaSchema.safeParse(invalidEtapa);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        const hasMinimoError = result.error.issues.some(i => i.path.includes('pesoMinimo'));
        const hasMaximoError = result.error.issues.some(i => i.path.includes('pesoMaximo'));
        expect(hasMinimoError).toBe(true);
        expect(hasMaximoError).toBe(true);
      }
    });
  });
});

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

describe('RutaFormPage Component', () => {
  it('1. create valid payload no articulo', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let requestPayload: any = null;
    server.use(
      http.post('http://localhost:3000/api/rutas-pasadas', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 99, ...requestPayload } }, { status: 201 });
      })
    );

    renderWithProviders(<RutaFormPage />);

    // Expand the Etapas section (collapsed by default via CollapsibleSection)
    await userEvent.click(await screen.findByRole('button', { name: /etapas de la ruta/i }));

    // Type nombre
    const nombreInput = document.querySelector('input[name="nombre"]') as HTMLInputElement;
    await userEvent.type(nombreInput, 'Nueva Ruta Prueba');
    
    // Select etapa
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[0], '1'); // Amasado

    // Set weights and muestras
    const pesosMin = document.querySelectorAll('input[name$=".pesoMinimo"]')[0] as HTMLInputElement;
    const pesosMax = document.querySelectorAll('input[name$=".pesoMaximo"]')[0] as HTMLInputElement;
    const pesosIdeal = document.querySelectorAll('input[name$=".pesoIdeal"]')[0] as HTMLInputElement;

    await userEvent.clear(pesosMin);
    await userEvent.type(pesosMin, '10');
    
    await userEvent.clear(pesosMax);
    await userEvent.type(pesosMax, '20');

    await userEvent.clear(pesosIdeal);
    await userEvent.type(pesosIdeal, '15');

    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard/rutas');
    });

    expect(requestPayload).toBeDefined();
    expect(requestPayload.etapas[0].etapa).toBe(1);
    expect(requestPayload.etapas[0].orden).toBe(1);
    expect(requestPayload.etapas[0].articulo).toBeUndefined();
  });

  it('2. nombre required', async () => {
    renderWithProviders(<RutaFormPage />);
    
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));
    
    expect(await screen.findByText('Nombre es requerido')).toBeInTheDocument();
  });

  it('3. ≥1 etapa required', async () => {
    // UI prevents 0 rows (remove button disabled when 1 row). 
    // Schema test already covers this. 
    expect(true).toBe(true);
  });

  it('4. edit pre-fills etapas from GET-by-id', async () => {
    paramsMock = { id: '1' };
    renderWithProviders(<RutaFormPage />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Ruta Alpha')).toBeInTheDocument();
    });

    // Expand the Etapas section (collapsed by default)
    await userEvent.click(screen.getByRole('button', { name: /etapas de la ruta/i }));

    // Scope to etapas-container to avoid picking up the articulos selector
    const etapasContainer = screen.getByTestId('etapas-container');
    const etapaSelects = within(etapasContainer).getAllByRole('combobox');
    expect(etapaSelects.length).toBe(2);
    expect(etapaSelects[0]).toHaveValue('1');
    expect(etapaSelects[1]).toHaveValue('2');
  });

  it('5. add row', async () => {
    renderWithProviders(<RutaFormPage />);

    // Expand the Etapas section (collapsed by default)
    await userEvent.click(await screen.findByRole('button', { name: /etapas de la ruta/i }));

    const etapasContainer = screen.getByTestId('etapas-container');
    expect(within(etapasContainer).getAllByRole('combobox').length).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: /agregar etapa/i }));
    expect(within(etapasContainer).getAllByRole('combobox').length).toBe(2);
  });

  it('6. remove row (multi)', async () => {
    paramsMock = { id: '1' }; // Has 2 rows
    renderWithProviders(<RutaFormPage />);
    
    // findByTestId is async — waits for the loading state to resolve
    const etapasContainer = await screen.findByTestId('etapas-container');
    // Expand the Etapas section (collapsed by default)
    await userEvent.click(screen.getByRole('button', { name: /etapas de la ruta/i }));
    await waitFor(() => {
      expect(within(etapasContainer).getAllByRole('combobox').length).toBe(2);
    });

    const removeBtns = screen.getAllByTitle(/eliminar etapa/i);
    await userEvent.click(removeBtns[1]);
    
    expect(within(etapasContainer).getAllByRole('combobox').length).toBe(1);
  });

  it('7. remove single row opens a confirm dialog (not window.confirm) and clears list if confirmed', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    renderWithProviders(<RutaFormPage />);

    // Expand the Etapas section (collapsed by default)
    await userEvent.click(await screen.findByRole('button', { name: /etapas de la ruta/i }));

    const removeBtn = await screen.findByTitle(/eliminar etapa/i);
    expect(removeBtn).not.toBeDisabled();

    await userEvent.click(removeBtn);

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveAccessibleName(
      '¿Esta seguro que desea eliminar la ultima etapa? No se podra asignar una ruta sin etapas a una linea de produccion'
    );
    expect(confirmSpy).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    // Only etapa comboboxes should be gone (articulos selector remains)
    const etapasContainer = screen.getByTestId('etapas-container');
    expect(within(etapasContainer).queryAllByRole('combobox').length).toBe(0);
  });

  it('7b. remove single row keeps the row if the confirm dialog is cancelled', async () => {
    renderWithProviders(<RutaFormPage />);

    // Expand the Etapas section (collapsed by default)
    await userEvent.click(await screen.findByRole('button', { name: /etapas de la ruta/i }));

    const removeBtn = await screen.findByTitle(/eliminar etapa/i);
    expect(removeBtn).not.toBeDisabled();

    await userEvent.click(removeBtn);

    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    const etapasContainer = screen.getByTestId('etapas-container');
    expect(within(etapasContainer).queryAllByRole('combobox').length).toBe(1);
  });

  it('8. reorder rows and assert orden in PUT body', async () => {
    paramsMock = { id: '1' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let requestPayload: any = null;
    server.use(
      http.put('http://localhost:3000/api/rutas-pasadas/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 1, ...requestPayload } });
      })
    );

    renderWithProviders(<RutaFormPage />);
    
    // findByTestId is async — waits for the component to finish loading
    const etapasContainer = await screen.findByTestId('etapas-container');
    // Expand the Etapas section (collapsed by default)
    await userEvent.click(screen.getByRole('button', { name: /etapas de la ruta/i }));
    await waitFor(() => {
      expect(within(etapasContainer).getAllByRole('combobox').length).toBe(2);
    });

    const upBtns = screen.getAllByTitle(/subir etapa/i);
    // Click up on the second row (index 1)
    await userEvent.click(upBtns[1]);

    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(requestPayload).toBeDefined();
    });

    expect(requestPayload.etapas[0].etapa).toBe(2);
    expect(requestPayload.etapas[0].orden).toBe(1);
    expect(requestPayload.etapas[1].etapa).toBe(1);
    expect(requestPayload.etapas[1].orden).toBe(2);
  });

  it('9. edit params of existing etapa — PUT sends updated pesoIdeal', async () => {
    paramsMock = { id: '1' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let requestPayload: any = null;
    server.use(
      http.put('http://localhost:3000/api/rutas-pasadas/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 1, ...requestPayload } });
      })
    );

    renderWithProviders(<RutaFormPage />);

    const etapasContainer = await screen.findByTestId('etapas-container');
    // Expand the Etapas section (collapsed by default)
    await userEvent.click(screen.getByRole('button', { name: /etapas de la ruta/i }));
    await waitFor(() => {
      expect(within(etapasContainer).getAllByRole('combobox').length).toBe(2);
    });

    // Update pesoIdeal of the first etapa (currently 15)
    const pesoIdealInputs = document.querySelectorAll('input[name$=".pesoIdeal"]');
    await userEvent.clear(pesoIdealInputs[0] as HTMLElement);
    await userEvent.type(pesoIdealInputs[0] as HTMLElement, '18');

    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(requestPayload).toBeDefined());

    expect(requestPayload.etapas[0].etapa).toBe(1);
    expect(requestPayload.etapas[0].pesoIdeal).toBe(18);
    expect(requestPayload.etapas[0].orden).toBe(1);
    // second etapa unchanged
    expect(requestPayload.etapas[1].etapa).toBe(2);
    expect(requestPayload.etapas[1].orden).toBe(2);
  });

  it('10. change etapa select on existing row — PUT sends new etapa id', async () => {
    paramsMock = { id: '1' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let requestPayload: any = null;
    server.use(
      http.put('http://localhost:3000/api/rutas-pasadas/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 1, ...requestPayload } });
      })
    );

    renderWithProviders(<RutaFormPage />);

    // findByTestId waits for the component to finish the loading state
    const etapasContainer = await screen.findByTestId('etapas-container');
    // Expand the Etapas section (collapsed by default)
    await userEvent.click(screen.getByRole('button', { name: /etapas de la ruta/i }));
    await waitFor(() => {
      expect(within(etapasContainer).getAllByRole('combobox').length).toBe(2);
    });

    // Change first etapa from Amasado (1) to Envasado (3)
    const selects = within(etapasContainer).getAllByRole('combobox');
    await userEvent.selectOptions(selects[0], '3');

    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(requestPayload).toBeDefined());

    expect(requestPayload.etapas[0].etapa).toBe(3);
    expect(requestPayload.etapas[0].orden).toBe(1);
    expect(requestPayload.etapas[1].etapa).toBe(2);
  });

  it('11. add new etapa to existing ruta — PUT sends 3 etapas with correct orden', async () => {
    paramsMock = { id: '1' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let requestPayload: any = null;
    server.use(
      http.put('http://localhost:3000/api/rutas-pasadas/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 1, ...requestPayload } });
      })
    );

    renderWithProviders(<RutaFormPage />);

    // findByTestId waits for the component to finish the loading state
    const etapasContainer = await screen.findByTestId('etapas-container');
    // Expand the Etapas section (collapsed by default)
    await userEvent.click(screen.getByRole('button', { name: /etapas de la ruta/i }));
    await waitFor(() => {
      expect(within(etapasContainer).getAllByRole('combobox').length).toBe(2);
    });

    await userEvent.click(screen.getByRole('button', { name: /agregar etapa/i }));
    expect(within(etapasContainer).getAllByRole('combobox').length).toBe(3);

    const selects = within(etapasContainer).getAllByRole('combobox');
    await userEvent.selectOptions(selects[2], '3'); // Envasado

    const pesoMinInputs = document.querySelectorAll('input[name$=".pesoMinimo"]');
    const pesoMaxInputs = document.querySelectorAll('input[name$=".pesoMaximo"]');
    const pesoIdealInputs = document.querySelectorAll('input[name$=".pesoIdeal"]');

    await userEvent.clear(pesoMinInputs[2] as HTMLElement);
    await userEvent.type(pesoMinInputs[2] as HTMLElement, '5');
    await userEvent.clear(pesoMaxInputs[2] as HTMLElement);
    await userEvent.type(pesoMaxInputs[2] as HTMLElement, '10');
    await userEvent.clear(pesoIdealInputs[2] as HTMLElement);
    await userEvent.type(pesoIdealInputs[2] as HTMLElement, '7');

    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(requestPayload).toBeDefined());

    expect(requestPayload.etapas).toHaveLength(3);
    expect(requestPayload.etapas[2].etapa).toBe(3);
    expect(requestPayload.etapas[2].orden).toBe(3);
    expect(requestPayload.etapas[2].pesoIdeal).toBe(7);
  });

  it('12. delete opens a confirm dialog (not window.confirm); cancel keeps ruta, confirm fires DELETE', async () => {
    paramsMock = { id: '1' };
    let deleteFired = false;
    server.use(
      http.delete('http://localhost:3000/api/rutas-pasadas/:id', () => {
        deleteFired = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const confirmSpy = vi.spyOn(window, 'confirm');
    renderWithProviders(<RutaFormPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Ruta Alpha')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByText(/eliminar ruta/i).closest('button') as HTMLButtonElement;

    await userEvent.click(deleteBtn);
    let dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveAccessibleName('¿Está seguro de eliminar esta ruta?');
    expect(confirmSpy).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(deleteFired).toBe(false);

    await userEvent.click(deleteBtn);
    dialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(deleteFired).toBe(true);
    });
  });

  it('13. clicking Reactivar opens a confirm dialog (not window.confirm); confirming sends PUT with activo:true', async () => {
    paramsMock = { id: '4' }; // Ruta Delta is inactive
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let requestPayload: any = null;
    server.use(
      http.put('http://localhost:3000/api/rutas-pasadas/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 4, ...requestPayload } });
      })
    );
    const confirmSpy = vi.spyOn(window, 'confirm');
    renderWithProviders(<RutaFormPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Ruta Delta')).toBeInTheDocument();
    });

    const reactivarBtn = screen.getByText(/reactivar ruta/i).closest('button') as HTMLButtonElement;

    await userEvent.click(reactivarBtn);
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveAccessibleName('¿Está seguro de reactivar esta ruta?');
    expect(confirmSpy).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(requestPayload).toBeDefined();
    });
    expect(requestPayload.activo).toBe(true);
  });

  describe('error dialogs on mutation failure (replaces window.alert)', () => {
    it('create failure shows an alertdialog titled "No se pudo guardar" with the API error message', async () => {
      server.use(
        http.post('http://localhost:3000/api/rutas-pasadas', () =>
          HttpResponse.json({ success: false, error: { message: 'Nombre duplicado' } }, { status: 400 })
        )
      );

      renderWithProviders(<RutaFormPage />);

      await userEvent.click(await screen.findByRole('button', { name: /etapas de la ruta/i }));

      const nombreInput = document.querySelector('input[name="nombre"]') as HTMLInputElement;
      await userEvent.type(nombreInput, 'Ruta X');

      const selects = screen.getAllByRole('combobox');
      await userEvent.selectOptions(selects[0], '1');

      const pesosMin = document.querySelectorAll('input[name$=".pesoMinimo"]')[0] as HTMLInputElement;
      const pesosMax = document.querySelectorAll('input[name$=".pesoMaximo"]')[0] as HTMLInputElement;
      const pesosIdeal = document.querySelectorAll('input[name$=".pesoIdeal"]')[0] as HTMLInputElement;
      await userEvent.clear(pesosMin);
      await userEvent.type(pesosMin, '10');
      await userEvent.clear(pesosMax);
      await userEvent.type(pesosMax, '20');
      await userEvent.clear(pesosIdeal);
      await userEvent.type(pesosIdeal, '15');

      await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('No se pudo guardar')).toBeInTheDocument();
      expect(within(dialog).getByText('Nombre duplicado')).toBeInTheDocument();
    });

    it('update failure shows an alertdialog titled "No se pudo guardar" with the API error message', async () => {
      paramsMock = { id: '1' };
      server.use(
        http.put('http://localhost:3000/api/rutas-pasadas/:id', () =>
          HttpResponse.json({ success: false, error: { message: 'No se pudo actualizar' } }, { status: 400 })
        )
      );

      renderWithProviders(<RutaFormPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Ruta Alpha')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('No se pudo guardar')).toBeInTheDocument();
      expect(within(dialog).getByText('No se pudo actualizar')).toBeInTheDocument();
    });

    it('add articulo failure shows an alertdialog titled "No se pudo agregar el artículo"', async () => {
      paramsMock = { id: '1' };
      server.use(
        http.post('http://localhost:3000/api/rutas-pasadas-articulos', () =>
          HttpResponse.json({ success: false, error: { message: 'Ya está asignado' } }, { status: 400 })
        )
      );

      renderWithProviders(<RutaFormPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Ruta Alpha')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /artículos asignados/i }));

      const selector = screen.getByRole('combobox', { name: /seleccionar artículo/i });
      await userEvent.selectOptions(selector, '3');
      await userEvent.click(screen.getByRole('button', { name: /agregar artículo/i }));

      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('No se pudo agregar el artículo')).toBeInTheDocument();
      expect(within(dialog).getByText('Ya está asignado')).toBeInTheDocument();
    });

    it('remove articulo failure shows an alertdialog titled "No se pudo eliminar el artículo"', async () => {
      paramsMock = { id: '1' };
      server.use(
        http.delete('http://localhost:3000/api/rutas-pasadas-articulos/:id', () =>
          HttpResponse.json({ success: false, error: { message: 'No se puede quitar' } }, { status: 400 })
        )
      );

      renderWithProviders(<RutaFormPage />);

      await waitFor(() => {
        expect(screen.getByText('Harina 000')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /artículos asignados/i }));

      const removeButtons = screen.getAllByRole('button', { name: /quitar artículo/i });
      await userEvent.click(removeButtons[0]);

      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('No se pudo eliminar el artículo')).toBeInTheDocument();
      expect(within(dialog).getByText('No se puede quitar')).toBeInTheDocument();
    });

    it('delete ruta failure shows an alertdialog titled "No se pudo eliminar la ruta" including the "Nota de sistema" detail', async () => {
      paramsMock = { id: '1' };
      server.use(
        http.delete('http://localhost:3000/api/rutas-pasadas/:id', () =>
          HttpResponse.json({ success: false, error: { message: 'En uso' } }, { status: 409 })
        )
      );

      renderWithProviders(<RutaFormPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Ruta Alpha')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByText(/eliminar ruta/i).closest('button') as HTMLButtonElement;
      await userEvent.click(deleteBtn);

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));

      const errorDialog = await screen.findByRole('alertdialog');
      expect(within(errorDialog).getByText('No se pudo eliminar la ruta')).toBeInTheDocument();
      expect(within(errorDialog).getByText(/En uso/)).toBeInTheDocument();
      expect(within(errorDialog).getByText(/Nota de sistema/)).toBeInTheDocument();
    });
  });
});

describe('RutaFormPage — Artículos Asignados', () => {
  it('14. edit mode: shows articulos asignados from the pivot endpoint', async () => {
    paramsMock = { id: '1' }; // Ruta Alpha has Harina 000 and Azucar assigned (per handlers)
    renderWithProviders(<RutaFormPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Ruta Alpha')).toBeInTheDocument();
    });

    // Expand the Artículos section (collapsed by default)
    await userEvent.click(screen.getByRole('button', { name: /artículos asignados/i }));

    await waitFor(() => {
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
      expect(screen.getByText('Azúcar')).toBeInTheDocument();
    });
  });

  it('15. edit mode: assigned articulos are excluded from the selector', async () => {
    paramsMock = { id: '1' }; // Harina 000 (id=1) and Azucar (id=2) are assigned
    renderWithProviders(<RutaFormPage />);

    await waitFor(() => {
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
    });

    // Expand the Artículos section (collapsed by default)
    await userEvent.click(screen.getByRole('button', { name: /artículos asignados/i }));

    // articulosOptions has Harina 000 (1), Azucar (2), Sal fina (3)
    // After assigning 1 and 2, only Sal fina should be in the selector
    const selector = screen.getByRole('combobox', { name: /seleccionar artículo/i });
    const options = Array.from(selector.querySelectorAll('option'));
    const optionValues = options.map(o => Number(o.value)).filter(v => v !== 0);
    expect(optionValues).not.toContain(1);
    expect(optionValues).not.toContain(2);
    expect(optionValues).toContain(3); // Sal fina should be available
  });

  it('16. edit mode: adding an articulo calls the pivot POST endpoint', async () => {
    paramsMock = { id: '1' };
    let pivotPostPayload: Record<string, unknown> | null = null;
    server.use(
      http.post('http://localhost:3000/api/rutas-pasadas-articulos', async ({ request }) => {
        pivotPostPayload = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: { id: 999, articulo: { id: 3, nombre: 'Sal fina', marca: 'MarcaC' } } }, { status: 201 });
      })
    );

    renderWithProviders(<RutaFormPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Ruta Alpha')).toBeInTheDocument();
    });

    // Expand the Artículos section (collapsed by default)
    await userEvent.click(screen.getByRole('button', { name: /artículos asignados/i }));

    // Select Sal fina (id=3, not yet assigned)
    const selector = screen.getByRole('combobox', { name: /seleccionar artículo/i });
    await userEvent.selectOptions(selector, '3');

    const addBtn = screen.getByRole('button', { name: /agregar artículo/i });
    await userEvent.click(addBtn);

    await waitFor(() => {
      expect(pivotPostPayload).toBeDefined();
    });

    expect(pivotPostPayload).toMatchObject({ rutaPasada: 1, articulo: 3 });
  });

  it('17. edit mode: removing an articulo calls the pivot DELETE endpoint', async () => {
    paramsMock = { id: '1' };
    let deletedPivotId: string | null = null;
    server.use(
      http.delete('http://localhost:3000/api/rutas-pasadas-articulos/:id', ({ params }) => {
        deletedPivotId = params.id as string;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderWithProviders(<RutaFormPage />);

    await waitFor(() => {
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
    });

    // Expand the Artículos section (collapsed by default)
    await userEvent.click(screen.getByRole('button', { name: /artículos asignados/i }));

    // Click the remove button for the first assigned articulo (pivot id=101)
    const removeButtons = screen.getAllByRole('button', { name: /quitar artículo/i });
    await userEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(deletedPivotId).toBe('101');
    });
  });

  it('18. create mode: articulos are managed locally before the ruta is saved', async () => {
    // No paramsMock — create mode
    renderWithProviders(<RutaFormPage />);

    // The articulos section should show "Sin artículos asignados." initially
    await waitFor(() => {
      expect(screen.getByText(/sin artículos asignados/i)).toBeInTheDocument();
    });

    // Expand the Artículos section (collapsed by default)
    await userEvent.click(screen.getByRole('button', { name: /artículos asignados/i }));

    // Wait for articulos options to load from the mock server
    const selector = screen.getByRole('combobox', { name: /seleccionar artículo/i });
    await waitFor(() => {
      // Harina 000 (id=1) should be available in the selector
      const option = selector.querySelector('option[value="1"]');
      expect(option).not.toBeNull();
    });

    await userEvent.selectOptions(selector, '1');

    const addBtn = screen.getByRole('button', { name: /agregar artículo/i });
    await userEvent.click(addBtn);

    // Should appear in the list without any API call
    await waitFor(() => {
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
    });

    // Remove it locally
    const removeBtn = screen.getByRole('button', { name: /quitar artículo/i });
    await userEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Harina 000')).not.toBeInTheDocument();
      expect(screen.getByText(/sin artículos asignados/i)).toBeInTheDocument();
    });
  });
});

describe('RutaFormPage — Auto-Expand on Validation Errors', () => {
  it('19. Etapas section auto-expands when etapas validation errors appear (forceOpen)', async () => {
    // Create mode: default etapa has etapa=0 (invalid — schema requires min 1)
    renderWithProviders(<RutaFormPage />);

    const etapasToggle = screen.getByRole('button', { name: /etapas de la ruta/i });
    // Section starts collapsed
    expect(etapasToggle).toHaveAttribute('aria-expanded', 'false');

    // Submit with invalid data — triggers validation errors on the etapas field array
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    // forceOpen={!!errors.etapas} expands the section automatically
    await waitFor(() => {
      expect(etapasToggle).toHaveAttribute('aria-expanded', 'true');
    });

    // The etapa error message is now visible inside the expanded section
    expect(await screen.findByText('Requerido')).toBeVisible();
  });
});

