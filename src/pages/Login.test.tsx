import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { DialogProvider } from '../components/dialogs/DialogProvider';
import { ThemeProvider } from '../features/theme/ThemeContext';
import Login from './Login';
import { loginApi } from '../api/auth';
import { vi } from 'vitest';

vi.mock('../api/auth', () => ({
  loginApi: vi.fn(),
}));

function renderLogin() {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <Login /> },
      { path: '/dashboard', element: <div data-testid="page-dashboard" /> },
      { path: '/tablet/seleccion-linea', element: <div data-testid="page-seleccion-linea" /> },
    ],
    { initialEntries: ['/login'] }
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <DialogProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </DialogProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

async function submitForm(username: string, password: string) {
  await userEvent.type(screen.getByRole('textbox', { name: /usuario o legajo/i }), username);
  await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
  // Wait for pin step
  await screen.findByLabelText(/contraseña/i);
  await userEvent.type(screen.getByLabelText(/contraseña/i), password);
  await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));
}

const createMockToken = (userPayload: object) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify(userPayload));
  return `${header}.${payload}.mock_signature`;
};

describe('Login — routing por rol', () => {
  it('operario navega a /tablet/seleccion-linea', async () => {
    const token = createMockToken({ id: 1, legajo: '1234', nombreUsuario: 'user', rol: 'operario', puedeTomarMuestrasLibres: false });
    vi.mocked(loginApi).mockResolvedValueOnce({ token });
    renderLogin();
    await submitForm('1234', '1111');
    expect(loginApi).toHaveBeenCalledWith({ legajo: '1234', pin: '1111' });
    await waitFor(() =>
      expect(screen.getByTestId('page-seleccion-linea')).toBeInTheDocument()
    );
  });

  it('jefe navega a /dashboard', async () => {
    const token = createMockToken({ id: 2, legajo: 'jefe1', nombreUsuario: 'jefe1', rol: 'jefe', puedeTomarMuestrasLibres: true });
    vi.mocked(loginApi).mockResolvedValueOnce({ token });
    renderLogin();
    await submitForm('jefe1', '2222');
    expect(loginApi).toHaveBeenCalledWith({ legajo: 'jefe1', pin: '2222' });
    await waitFor(() =>
      expect(screen.getByTestId('page-dashboard')).toBeInTheDocument()
    );
  });

  it('administrador navega a /dashboard', async () => {
    const token = createMockToken({ id: 3, legajo: 'admin', nombreUsuario: 'admin', rol: 'administrador', puedeTomarMuestrasLibres: true });
    vi.mocked(loginApi).mockResolvedValueOnce({ token });
    renderLogin();
    await submitForm('admin', '3333');
    expect(loginApi).toHaveBeenCalledWith({ legajo: 'admin', pin: '3333' });
    await waitFor(() =>
      expect(screen.getByTestId('page-dashboard')).toBeInTheDocument()
    );
  });

  it('muestra error cuando las credenciales son inválidas', async () => {
    vi.mocked(loginApi).mockRejectedValueOnce(new Error('Network Error'));
    renderLogin();
    await submitForm('1111', '1234');
    await waitFor(() =>
      expect(screen.getByText(/PIN o legajo incorrecto/i)).toBeInTheDocument()
    );
  });

  it('muestra el botón Continuar deshabilitado si está vacío', async () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
  });

  it('muestra el botón Ingresar deshabilitado si el PIN tiene menos de 4 dígitos', async () => {
    renderLogin();
    await userEvent.type(screen.getByRole('textbox', { name: /usuario o legajo/i }), 'admin');
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
    
    await screen.findByLabelText(/contraseña/i);
    await userEvent.type(screen.getByLabelText(/contraseña/i), '123'); // Sólo 3 dígitos
    
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeDisabled();
    
    await userEvent.type(screen.getByLabelText(/contraseña/i), '4'); // Ahora tiene 4
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeEnabled();
  });
});
