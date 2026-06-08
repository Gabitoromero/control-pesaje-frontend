import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAuth } from '../../../test/render';
import type { User } from '../../../shared/types/auth';
import { ActivarSesionPage } from './ActivarSesionPage.tsx';
import { setupServer } from 'msw/node';
import { handlers } from '../../../test/handlers';
import { vi } from 'vitest';

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const operarioUser: User = {
  id: 3,
  nombreUsuario: 'operario1',
  rol: 'operario',
  puedeTomarMuestrasLibres: false,
};

const withLineaState = {
  user: operarioUser,
  initialEntries: [
    { pathname: '/tablet/activar-sesion', state: { lineaId: 1, lineaNombre: 'Línea 1 — Envasado A' } },
  ],
};

describe('ActivarSesionPage', () => {
  it('redirige a /login si no está autenticado', () => {
    renderWithAuth(<ActivarSesionPage />, {
      initialEntries: [{ pathname: '/tablet/activar-sesion', state: { lineaId: 1 } }],
    });
    expect(screen.queryByText(/Ingresá tu legajo/)).not.toBeInTheDocument();
  });

  it('empieza en el paso de legajo', () => {
    renderWithAuth(<ActivarSesionPage />, withLineaState);
    expect(screen.getByText('Ingresá tu legajo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument();
  });

  it('el stepper muestra el paso inicial de legajo correctamente', () => {
    renderWithAuth(<ActivarSesionPage />, withLineaState);
    const stepperUi = screen.getByTestId('stepper-ui');
    expect(stepperUi).toBeInTheDocument();
    
    const stepLegajo = screen.getByTestId('stepper-step-legajo');
    const stepPin = screen.getByTestId('stepper-step-pin');
    const line = screen.getByTestId('stepper-line');
    
    expect(stepLegajo).toHaveClass('border-blue-500', 'bg-blue-500/20', 'text-blue-400');
    expect(stepPin).toHaveClass('border-slate-700', 'bg-slate-800', 'text-slate-500');
    expect(line).toHaveClass('bg-slate-700');
  });

  it('el stepper actualiza su estado al avanzar al paso de PIN', async () => {
    renderWithAuth(<ActivarSesionPage />, withLineaState);
    
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
    
    const stepPin = screen.getByTestId('stepper-step-pin');
    const line = screen.getByTestId('stepper-line');
    
    expect(stepPin).toHaveClass('border-blue-500', 'bg-blue-500/20', 'text-blue-400');
    expect(line).toHaveClass('bg-blue-500');
  });

  it('el botón Continuar está deshabilitado sin legajo', () => {
    renderWithAuth(<ActivarSesionPage />, withLineaState);
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
  });

  it('el teclado numérico muestra los dígitos ingresados', async () => {
    renderWithAuth(<ActivarSesionPage />, withLineaState);
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('el botón borrar elimina el último dígito', async () => {
    renderWithAuth(<ActivarSesionPage />, withLineaState);
    await userEvent.click(screen.getByRole('button', { name: '4' }));
    await userEvent.click(screen.getByRole('button', { name: '5' }));
    await userEvent.click(screen.getByRole('button', { name: '⌫' }));
    // After deleting '5', only '4' remains in the display (not the button)
    const display = document.querySelector('.bg-slate-800.border.border-slate-700.rounded-2xl');
    expect(display?.textContent?.trim()).toBe('4');
  });

  it('confirmar legajo muestra el paso de PIN', async () => {
    renderWithAuth(<ActivarSesionPage />, withLineaState);
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
    expect(screen.getByRole('button', { name: /activar sesión/i })).toBeInTheDocument();
  });

  it('el botón Activar está deshabilitado hasta ingresar 4 dígitos de PIN y permite hasta 6 dígitos', async () => {
    renderWithAuth(<ActivarSesionPage />, withLineaState);
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));

    const activar = screen.getByRole('button', { name: /activar sesión/i });
    expect(activar).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    expect(activar).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: '4' }));
    expect(activar).not.toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: '5' }));
    expect(activar).not.toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: '6' }));
    expect(activar).not.toBeDisabled();
  });

  it('muestra el nombre de la línea en el título', () => {
    renderWithAuth(<ActivarSesionPage />, withLineaState);
    expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
  });

  it('envía legajo y PIN correctamente al llamar a la API y redirige', async () => {
    renderWithAuth(<ActivarSesionPage />, withLineaState);
    
    // Ingresemos Legajo
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
    
    // Ingresemos PIN
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    await userEvent.click(screen.getByRole('button', { name: '4' }));
    
    const activarBtn = screen.getByRole('button', { name: /activar sesión/i });
    await userEvent.click(activarBtn);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/tablet', {
        state: { lineaId: 1, legajo: '123' },
      });
    });
  });

  it('muestra el mensaje de error cuando falla la autenticación', async () => {
    renderWithAuth(<ActivarSesionPage />, withLineaState);
    
    // Ingresemos Legajo y un PIN incorrecto para probar el error (por ejemplo, PIN 9999)
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
    
    await userEvent.click(screen.getByRole('button', { name: '9' }));
    await userEvent.click(screen.getByRole('button', { name: '9' }));
    await userEvent.click(screen.getByRole('button', { name: '9' }));
    await userEvent.click(screen.getByRole('button', { name: '9' }));
    
    const activarBtn = screen.getByRole('button', { name: /activar sesión/i });
    await userEvent.click(activarBtn);
    
    expect(await screen.findByText('PIN o legajo incorrecto')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
