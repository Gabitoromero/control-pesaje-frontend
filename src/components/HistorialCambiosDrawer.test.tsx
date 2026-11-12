import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { HistorialCambiosDrawer } from './HistorialCambiosDrawer';
import * as api from '../api/historial-cambios';

vi.mock('../api/historial-cambios');

const item = (over: Partial<api.HistorialCambioItem>): api.HistorialCambioItem => ({
  id: 1, entidad: 'articulo', entidadId: 5, raizTipo: 'articulo', raizId: 5, accion: 'editar',
  fecha: '2026-11-12T13:00:00.000Z', antes: {}, despues: {},
  usuario: { id: 2, nombreApellido: 'Ana Pérez', nombreUsuario: 'ana' }, ...over,
});

describe('HistorialCambiosDrawer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('queries by root and shows user, action and the before → after diff', async () => {
    vi.mocked(api.getHistorialCambios).mockResolvedValue({
      items: [item({ antes: { nombre: 'Viejo' }, despues: { nombre: 'Nuevo' } })],
      total: 1, page: 1, pageSize: 20,
    });

    renderWithProviders(<HistorialCambiosDrawer raizTipo="articulo" raizId={5} title="Harina" open onOpenChange={() => {}} />);

    expect(await screen.findByText(/Edición/)).toBeInTheDocument();
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('@ana')).toBeInTheDocument();
    expect(screen.getByText('AP')).toBeInTheDocument();
    expect(screen.getByText('Viejo')).toBeInTheDocument();
    expect(screen.getByText('Nuevo')).toBeInTheDocument();
    expect(api.getHistorialCambios).toHaveBeenCalledWith({ raizTipo: 'articulo', raizId: 5, page: 1, pageSize: 20 });
  });

  it('labels nested ruta entities and system changes', async () => {
    vi.mocked(api.getHistorialCambios).mockResolvedValue({
      items: [item({ entidad: 'ruta_etapa', accion: 'eliminar', antes: { toleranciaPct: 5 }, usuario: null })],
      total: 1, page: 1, pageSize: 20,
    });
    renderWithProviders(<HistorialCambiosDrawer raizTipo="ruta" raizId={3} title="Ruta 1" open onOpenChange={() => {}} />);

    expect(await screen.findByText(/Eliminación · Etapa de la ruta/)).toBeInTheDocument();
    expect(screen.getByText('Sistema')).toBeInTheDocument();
  });

  it('shows the current name of referenced entities instead of bare ids', async () => {
    vi.mocked(api.getHistorialCambios).mockResolvedValue({
      items: [
        item({ entidad: 'ruta_articulo', accion: 'crear', despues: { articulo: 29, rutaPasada: 3 } }),
        item({ id: 2, entidad: 'ruta_articulo', accion: 'eliminar', antes: { id: 6, articulo: 6, rutaPasada: 3 } }),
      ],
      referencias: { articulo: { '29': 'A29 - Cono' }, rutaPasada: { '3': 'Ruta Calibracion' } },
      total: 2, page: 1, pageSize: 20,
    });
    renderWithProviders(<HistorialCambiosDrawer raizTipo="ruta" raizId={3} title="Ruta (título)" open onOpenChange={() => {}} />);

    expect(await screen.findByText('A29 - Cono')).toBeInTheDocument();
    expect(screen.getAllByText('Ruta Calibracion')).toHaveLength(2);
    expect(screen.getByText('#6 (ya no existe)')).toBeInTheDocument();
  });

  it('names the etapa of a nested change and shows the total plus pagination only when there are several pages', async () => {
    vi.mocked(api.getHistorialCambios).mockResolvedValue({
      items: [item({ entidad: 'ruta_etapa', despues: { toleranciaPct: 7 }, antes: { toleranciaPct: null }, contexto: 'Corte' })],
      total: 45, page: 1, pageSize: 20,
    });
    renderWithProviders(<HistorialCambiosDrawer raizTipo="ruta" raizId={3} title="Ruta 1" open onOpenChange={() => {}} />);

    expect(await screen.findByText('Corte')).toBeInTheDocument();
    expect(screen.getByText('45 cambios · Página 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
  });

  it('shows only the total, without pagination buttons, when everything fits one page', async () => {
    vi.mocked(api.getHistorialCambios).mockResolvedValue({ items: [item({})], total: 11, page: 1, pageSize: 20 });
    renderWithProviders(<HistorialCambiosDrawer raizTipo="articulo" raizId={5} title="Harina" open onOpenChange={() => {}} />);

    expect(await screen.findByText('11 cambios')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
  });

  it('colors the user avatar with the sector color when the user has a sector', async () => {
    vi.mocked(api.getHistorialCambios).mockResolvedValue({
      items: [item({ usuario: { id: 2, nombreApellido: 'Ana Pérez', nombreUsuario: 'ana', sector: 'OF' } })],
      total: 1, page: 1, pageSize: 20,
    });
    renderWithProviders(<HistorialCambiosDrawer raizTipo="articulo" raizId={5} title="Harina" open onOpenChange={() => {}} />);

    const avatar = (await screen.findByText('AP')).closest('span') as HTMLElement;
    expect(avatar.style.backgroundColor).not.toBe('');
  });

  it('does not fetch while closed', () => {
    vi.mocked(api.getHistorialCambios).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    renderWithProviders(<HistorialCambiosDrawer raizTipo="etapa" raizId={1} title="Corte" open={false} onOpenChange={() => {}} />);
    expect(api.getHistorialCambios).not.toHaveBeenCalled();
  });
});
