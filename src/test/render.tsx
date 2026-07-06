import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { InitialEntry } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../features/auth/context/AuthContext';
import type { AuthContextType } from '../features/auth/context/AuthContext';
import type { User } from '../shared/types/auth';
import { DialogProvider } from '../components/dialogs/DialogProvider';
import { Toaster } from '../components/ui/sonner';

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

export function renderWithProviders(ui: ReactNode) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <DialogProvider>
        <MemoryRouter>{ui}</MemoryRouter>
        <Toaster />
      </DialogProvider>
    </QueryClientProvider>
  );
}

/**
 * Renders a component with a mocked AuthContext — no localStorage/cookies touched.
 * Pass `user` to simulate an authenticated session; omit for an unauthenticated render.
 */
export function renderWithAuth(
  ui: ReactNode,
  {
    user,
    activeLineaId = null,
    initialEntries = ['/'] as InitialEntry[],
  }: {
    user?: User;
    activeLineaId?: number | null;
    initialEntries?: InitialEntry[];
  } = {}
) {
  const authValue: AuthContextType = {
    user: user ?? null,
    token: user ? 'test-jwt-token' : null,
    activeLineaId,
    isAuthenticated: !!user,
    login: vi.fn(),
    logout: vi.fn(),
    openLineSession: vi.fn(),
    closeLineSession: vi.fn().mockResolvedValue(undefined),
  };

  return {
    ...render(
      <QueryClientProvider client={makeQueryClient()}>
        <AuthContext.Provider value={authValue}>
          <DialogProvider>
            <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
            <Toaster />
          </DialogProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    ),
    authValue,
  };
}
