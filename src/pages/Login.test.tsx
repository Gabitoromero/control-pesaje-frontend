import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { handlers } from '../test/handlers';
import { AuthProvider } from '../features/auth/context/AuthContext';
import Login from './Login';

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

async function submitForm(username: string, password: string) {
  await userEvent.type(screen.getByPlaceholderText('Usuario o Legajo'), username);
  await userEvent.type(screen.getByPlaceholderText('Contraseña'), password);
  await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));
}

describe('Login — routing por rol', () => {
  it('operario navega a /tablet/seleccion-linea', async () => {
    renderLogin();
    await submitForm('operario1', 'password');
    await waitFor(() =>
      expect(screen.getByTestId('page-seleccion-linea')).toBeInTheDocument()
    );
  });

  it('jefe navega a /dashboard', async () => {
    renderLogin();
    await submitForm('jefe1', 'password');
    await waitFor(() =>
      expect(screen.getByTestId('page-dashboard')).toBeInTheDocument()
    );
  });

  it('administrador navega a /dashboard', async () => {
    renderLogin();
    await submitForm('admin', 'password');
    await waitFor(() =>
      expect(screen.getByTestId('page-dashboard')).toBeInTheDocument()
    );
  });

  it('muestra error cuando las credenciales son inválidas', async () => {
    renderLogin();
    await submitForm('noexiste', 'wrong');
    await waitFor(() =>
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
    );
  });

  it('muestra error de validación si se envía el form vacío', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));
    expect(screen.getByText(/ingresá usuario\/legajo y contraseña/i)).toBeInTheDocument();
  });
});
