import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RemoteCombobox } from './RemoteCombobox';
import type { Page } from '../../api/pagination';

type Option = { id: number; nombre: string };

const pageOf = (items: Option[], total = items.length): Page<Option> => ({ items, total, page: 1, pageSize: 20 });

const setup = (props: Partial<React.ComponentProps<typeof RemoteCombobox>> = {}) => {
  const search = vi.fn(async (q: { q: string }) =>
    pageOf(q.q ? [{ id: 9, nombre: `Resultado ${q.q}` }] : [{ id: 1, nombre: 'Amasado' }, { id: 2, nombre: 'Envasado' }]),
  );
  const fetchById = vi.fn(async (id: number) => ({ id, nombre: `Etiqueta ${id}` }));
  const onChange = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RemoteCombobox
        value={null}
        onChange={onChange}
        queryKey="things"
        search={search}
        fetchById={fetchById}
        debounceMs={10}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { search, fetchById, onChange };
};

const open = () => userEvent.click(screen.getByRole('button', { name: /Seleccione\.\.\./ }));

describe('RemoteCombobox', () => {
  it('requests a bounded first page when opened and picks an option', async () => {
    const { search, onChange } = setup();

    await open();

    expect(await screen.findByText('Amasado')).toBeInTheDocument();
    expect(search).toHaveBeenCalledWith({ q: '', page: 1, pageSize: 20 });
    await userEvent.click(screen.getByText('Envasado'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('does not request anything while closed', () => {
    const { search } = setup();

    expect(search).not.toHaveBeenCalled();
  });

  it('searches in the server after the debounce and does not filter again locally', async () => {
    const { search } = setup();
    await open();
    await screen.findByText('Amasado');

    await userEvent.type(screen.getByPlaceholderText('Buscar...'), 'zeta');

    expect(await screen.findByText('Resultado zeta')).toBeInTheDocument();
    expect(search).toHaveBeenLastCalledWith({ q: 'zeta', page: 1, pageSize: 20 });
    expect(screen.queryByText('Amasado')).not.toBeInTheDocument();
  });

  it('keeps the newest search when an older response arrives late', async () => {
    let releaseOld: (page: Page<Option>) => void = () => undefined;
    const search = vi.fn((q: { q: string }) =>
      q.q === 'a'
        ? new Promise<Page<Option>>((resolve) => {
            releaseOld = resolve;
          })
        : Promise.resolve(pageOf([{ id: q.q ? 5 : 1, nombre: q.q ? 'Nuevo' : 'Inicial' }])),
    );
    setup({ search });
    await open();
    await screen.findByText('Inicial');
    const input = screen.getByPlaceholderText('Buscar...');

    await userEvent.type(input, 'a');
    await waitFor(() => expect(search).toHaveBeenCalledWith({ q: 'a', page: 1, pageSize: 20 }));
    await userEvent.type(input, 'b');
    expect(await screen.findByText('Nuevo')).toBeInTheDocument();
    releaseOld(pageOf([{ id: 7, nombre: 'Viejo' }]));

    await waitFor(() => expect(screen.queryByText('Viejo')).not.toBeInTheDocument());
    expect(screen.getByText('Nuevo')).toBeInTheDocument();
  });

  it('shows the selected label from a by-id lookup when it is outside the results', async () => {
    const { fetchById } = setup({ value: 42 });

    expect(await screen.findByRole('button', { name: 'Etiqueta 42' })).toBeInTheDocument();
    expect(fetchById).toHaveBeenCalledWith(42);
  });

  it('does not look up the placeholder value 0, which means "nothing selected"', async () => {
    const { fetchById } = setup({ value: 0 });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetchById).not.toHaveBeenCalled();
  });

  it('tells the user when the results are only part of the catalog', async () => {
    setup({ search: vi.fn(async () => pageOf([{ id: 1, nombre: 'Amasado' }], 45)) });

    await open();

    expect(await screen.findByText('Mostrando 1 de 45. Refine la búsqueda para ver más.')).toBeInTheDocument();
  });

  it('shows an error with a retry button that requests again', async () => {
    const search = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(pageOf([{ id: 1, nombre: 'Amasado' }]));
    setup({ search });

    await open();
    expect(await screen.findByText('No se pudieron cargar las opciones.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Amasado')).toBeInTheDocument();
  });
});
