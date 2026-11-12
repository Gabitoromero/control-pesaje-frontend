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
    expect(screen.getByText('Ana Pérez (ana)')).toBeInTheDocument();
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

  it('does not fetch while closed', () => {
    vi.mocked(api.getHistorialCambios).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    renderWithProviders(<HistorialCambiosDrawer raizTipo="etapa" raizId={1} title="Corte" open={false} onOpenChange={() => {}} />);
    expect(api.getHistorialCambios).not.toHaveBeenCalled();
  });
});
