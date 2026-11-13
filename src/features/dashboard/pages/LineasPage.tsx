import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLineas,
  getLineasInactivas,
  createLinea,
  updateLinea,
  deleteLinea,
  assignDeviceToLinea,
  type Linea,
  type LineaCreate,
} from '../../../api/lineas';
import { getRutas } from '../../../api/rutas';
import { getBalanzas } from '../../../api/balanzas';
import { getArticulos } from '../../../api/articulos';
import { getArticulosPorRuta } from '../../../api/rutas-pasadas-articulos';
import { dispositivosApi } from '../../../api/dispositivos';
import { Plus, Edit, Trash, History, Eye } from 'lucide-react';
import { HistorialCambiosDrawer } from '../../../components/HistorialCambiosDrawer';
import { EntityDetailDrawer } from '../../../components/EntityDetailDrawer';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';
import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage } from '../../../utils/errors';
import { toast } from 'sonner';
import { SearchableCombobox } from '../../../components/ui/SearchableCombobox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useActividadGlobal } from '../hooks/useActividadGlobal';
import { focusFirstFormError } from './focusFirstFormError';


const EMPTY_FORM = {
  nombre: '',
  rutaPasadaActiva: '',
  dispositivoHardwareId: '',
  idBalanza: '',
  articuloId: '',
  observacion: '',
};

const LINEA_FIELDS: SearchField[] = [
  { value: 'nombre', label: 'Nombre' },
];

export const LineasPage = () => {
  const queryClient = useQueryClient();
  const { alertSuccess, alertWarning, confirm } = useDialog();

  const notifyOutcome = (accion: 'creada' | 'actualizada' | 'activada', rutaPasadaActiva: number | null | undefined) => {
    if (rutaPasadaActiva) {
      alertSuccess({ title: `Línea ${accion} exitosamente` });
    } else {
      alertWarning({
        title: `Línea ${accion} sin ruta activa`,
        description: 'La línea fue guardada correctamente, pero no tiene una ruta de pasada activa asignada.',
      });
    }
  };
  
  const { hayActividad, lineaIdsConActividad } = useActividadGlobal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLinea, setEditingLinea] = useState<Linea | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [detalle, setDetalle] = useState<Linea | null>(null);
  const [historial, setHistorial] = useState<{ id?: number; title: string } | null>(null);
  const [status, setStatus] = useState<'activo' | 'inactivo'>('activo');
  const [field, setField] = useState('nombre');
  const [query, setQuery] = useState('');

  const { data: activas = [], isLoading: loadingActivas, error: errorActivas } = useQuery({
    queryKey: ['lineas'],
    queryFn: getLineas,
  });

  const { data: inactivas = [], isLoading: loadingInactivas, error: errorInactivas } = useQuery({
    queryKey: ['lineas-inactivos'],
    queryFn: getLineasInactivas,
  });

  const { data: rutas = [] } = useQuery({
    queryKey: ['rutas'],
    queryFn: getRutas,
  });

  const { data: dispositivos = [] } = useQuery({
    queryKey: ['dispositivos'],
    queryFn: dispositivosApi.getConectados,
  });

  const { data: balanzas = [] } = useQuery({
    queryKey: ['balanzas'],
    queryFn: getBalanzas,
  });

  const { data: articulos = [] } = useQuery({
    queryKey: ['articulos'],
    queryFn: getArticulos,
  });

  // The artículo of a línea must belong to the línea's ruta (the backend rejects a
  // pasada otherwise), so once a ruta is chosen only its artículos are offered.
  const selectedRutaId = formData.rutaPasadaActiva ? Number(formData.rutaPasadaActiva) : null;
  const selectedRuta = rutas.find((r) => r.id === selectedRutaId);

  const {
    data: articulosDeRuta,
    isSuccess: articulosDeRutaListos,
    isError: articulosDeRutaConError,
  } = useQuery({
    queryKey: ['articulos-por-ruta', selectedRutaId],
    queryFn: () => getArticulosPorRuta(selectedRutaId as number),
    enabled: selectedRutaId !== null,
  });

  const articulosDisponibles = selectedRutaId === null ? articulos : (articulosDeRuta ?? []);

  // Clears the chosen artículo when the ruta does not contain it. It shares the query cache
  // with the useQuery above, so no extra request is made for a ruta that is already loaded.
  const descartarArticuloAjeno = async (rutaId: number) => {
    try {
      const deLaRuta = await queryClient.fetchQuery({
        queryKey: ['articulos-por-ruta', rutaId],
        queryFn: () => getArticulosPorRuta(rutaId),
      });
      setFormData((prev) =>
        prev.rutaPasadaActiva === String(rutaId) &&
        prev.articuloId &&
        !deLaRuta.some((a) => a.id === Number(prev.articuloId))
          ? { ...prev, articuloId: '' }
          : prev
      );
    } catch {
      // The load error is shown next to the artículo field, with a retry button.
    }
  };

  const handleRutaChange = (val: number | null) => {
    setFormData((prev) => ({
      ...prev,
      rutaPasadaActiva: val ? String(val) : '',
      // Without a ruta the artículo is picked again from the full list.
      ...(val ? {} : { articuloId: '' }),
    }));
    if (val) void descartarArticuloAjeno(val);
  };

  const isLoading = loadingActivas || loadingInactivas;
  const error = errorActivas || errorInactivas;

  const lineasFiltradas = useMemo(() => {
    const base = status === 'activo' ? activas : inactivas;
    const q = query.trim().toLowerCase();

    let result = base;
    if (q) {
      result = base.filter((l) =>
        String(l[field as keyof Linea] ?? '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [activas, inactivas, status, field, query]);

  const saveDeviceMutation = useMutation({
    mutationFn: ({ id, hardwareId }: { id: number; hardwareId: string | null }) => 
      assignDeviceToLinea(id, hardwareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      queryClient.invalidateQueries({ queryKey: ['lineas-inactivos'] });
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
    },
    onError: (err: unknown) => {
      toast.error('Error al asignar dispositivo', {
        description: getApiErrorMessage(err, 'El dispositivo puede estar asignado a otra línea.'),
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LineaCreate & { activo?: boolean, dispositivoHardwareId?: string }) => {
      const linea = await createLinea(data);
      if (data.dispositivoHardwareId && linea.id) {
        try {
          await saveDeviceMutation.mutateAsync({ id: linea.id, hardwareId: data.dispositivoHardwareId });
        } catch (err) {
          (err as Record<string, unknown>).__deviceError = true;
          throw err;
        }
      }
      return linea;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      queryClient.invalidateQueries({ queryKey: ['lineas-inactivos'] });
      closeModal();
      notifyOutcome('creada', variables.rutaPasadaActiva);
    },
    onError: (err: unknown) => {
      if ((err as Record<string, unknown>)?.__deviceError) return;
      toast.error('No se pudo crear la línea', {
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, hardwareId }: {
      id: number;
      data: Partial<LineaCreate> & { activo?: boolean };
      hardwareId?: string;
      accion: 'actualizada' | 'activada';
    }) => {
      const linea = await updateLinea(id, data);
      
      const originalHardwareId = editingLinea?.dispositivo?.hardwareId || '';
      if (hardwareId !== undefined && hardwareId !== originalHardwareId) {
        try {
          await saveDeviceMutation.mutateAsync({ id, hardwareId: hardwareId === '' ? null : hardwareId });
        } catch (err) {
          // saveDeviceMutation.onError already shows its own toast.
          // Mark the error so updateMutation.onError doesn't duplicate it.
          const marked = err instanceof Error ? err : new Error(String(err));
          (marked as unknown as Record<string, unknown>).__deviceError = true;
          throw marked;
        }
      }
      return linea;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      queryClient.invalidateQueries({ queryKey: ['lineas-inactivos'] });
      closeModal();
      notifyOutcome(variables.accion, variables.data.rutaPasadaActiva);
    },
    onError: (err: unknown) => {
      // saveDeviceMutation already handles its own errors with a toast
      if ((err as Record<string, unknown>)?.__deviceError) return;
      toast.error('No se pudo guardar la línea', {
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado al guardar la línea.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLinea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      queryClient.invalidateQueries({ queryKey: ['lineas-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error('No se pudo eliminar la línea', {
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const openModal = (linea?: Linea) => {
    if (linea) {
      setEditingLinea(linea);
      setFormData({
        nombre: linea.nombre,
        rutaPasadaActiva: linea.rutaPasadaActiva?.id?.toString() || '',
        dispositivoHardwareId: linea.dispositivo?.hardwareId || '',
        idBalanza: linea.idBalanza?.toString() || '',
        articuloId: linea.articuloId?.toString() || '',
        observacion: linea.observacion ?? '',
      });
      if (linea.rutaPasadaActiva?.id) void descartarArticuloAjeno(linea.rutaPasadaActiva.id);
    } else {
      setEditingLinea(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLinea(null);
    setFormData(EMPTY_FORM);
  };

  const falta = { idBalanza: !formData.idBalanza, articuloId: !formData.articuloId };
  const canSubmit = !falta.idBalanza && !falta.articuloId;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canSubmit) {
      // Scroll to the first missing field and pulse it red (same effect as the Rutas form).
      focusFirstFormError({
        ...(falta.idBalanza && { idBalanza: { type: 'required' } }),
        ...(falta.articuloId && { articuloId: { type: 'required' } }),
      });
      return;
    }

    const observacion = formData.observacion.trim();

    if (editingLinea?.id) {
      updateMutation.mutate({
        id: editingLinea.id,
        data: {
          nombre: formData.nombre,
          rutaPasadaActiva: formData.rutaPasadaActiva ? Number(formData.rutaPasadaActiva) : null,
          idBalanza: Number(formData.idBalanza),
          articuloId: Number(formData.articuloId),
          // Empty means "cleared" here — unlike a create, this PUT reflects
          // the form's current state, so an emptied field sends null.
          observacion: observacion || null,
        },
        hardwareId: formData.dispositivoHardwareId,
        accion: 'actualizada',
      });
    } else {
      createMutation.mutate({
        nombre: formData.nombre,
        rutaPasadaActiva: formData.rutaPasadaActiva ? Number(formData.rutaPasadaActiva) : undefined,
        activo: true,
        dispositivoHardwareId: formData.dispositivoHardwareId,
        idBalanza: Number(formData.idBalanza),
        articuloId: Number(formData.articuloId),
        // Backend rejects an empty string ("" fails Zod's min(1)) — omit the
        // key entirely rather than sending "".
        ...(observacion && { observacion }),
      });
    }
  };

  const handleDelete = async () => {
    if (!editingLinea?.id) return;
    const confirmed = await confirm({
      title: '¿Está seguro de eliminar esta línea?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(editingLinea.id);
    }
  };

  const handleActivar = () => {
    if (!editingLinea?.id) return;
    updateMutation.mutate({
      id: editingLinea.id,
      data: {
        nombre: formData.nombre,
        rutaPasadaActiva: formData.rutaPasadaActiva ? Number(formData.rutaPasadaActiva) : null,
        activo: true,
        idBalanza: formData.idBalanza ? Number(formData.idBalanza) : undefined,
        articuloId: formData.articuloId ? Number(formData.articuloId) : undefined,
      },
      hardwareId: formData.dispositivoHardwareId,
      accion: 'activada',
    });
  };

  const isBusy = createMutation.isPending || updateMutation.isPending || saveDeviceMutation.isPending;

  if (isLoading) return <div className="p-6 text-foreground">Cargando líneas...</div>;
  if (error) return <div className="p-6 text-destructive">Error al cargar líneas</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Líneas</h1>
        <button
          onClick={() => openModal()}
          disabled={hayActividad}
          title={hayActividad ? 'No se pueden crear líneas mientras haya pasadas o sesiones activas' : ''}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} /> Nueva Línea
        </button>
      </div>

      <SearchToolbar
        status={status}
        onStatusChange={setStatus}
        fields={LINEA_FIELDS}
        field={field}
        onFieldChange={setField}
        query={query}
        onQueryChange={setQuery}
      />

      {hayActividad && (
        <div className="mb-6 p-4 bg-warning/20 border border-warning/50 rounded-md text-foreground">
          <p className="font-semibold flex items-center gap-2">
            ⚠️ Bloqueo de seguridad activo
          </p>
          <p className="text-sm mt-1">
            Las líneas resaltadas en amarillo tienen una pasada o sesión activa y no se pueden editar hasta que finalice.
            Tampoco se pueden crear líneas nuevas mientras haya pasadas o sesiones activas en el sistema.
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dispositivo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ruta Activa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {lineasFiltradas.map((linea) => {
                // Linea.id is optional in the API type; a line without id cannot be locked.
                const bloqueada = linea.id !== undefined && lineaIdsConActividad.has(linea.id);
                return (
                <tr key={linea.id} className={`${bloqueada ? 'bg-warning/20' : 'hover:bg-accent even:bg-muted/40'} ${linea.activo === false ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">{linea.nombre}</td>
                  <td className="px-4 py-4 whitespace-nowrap max-w-[14rem] truncate text-sm text-muted-foreground">
                    {linea.dispositivo ? `${linea.dispositivo.nombre} (${linea.dispositivo.hardwareId.slice(0, 8)})` : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap max-w-[14rem] truncate text-sm text-muted-foreground" title={linea.rutaPasadaActiva?.nombre}>{linea.rutaPasadaActiva?.nombre ?? '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${linea.activo !== false ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'}`}>
                      {linea.activo !== false ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => setDetalle(linea)}
                      className="text-muted-foreground hover:text-foreground mr-5"
                      title="Ver detalle"
                      aria-label="Ver detalle"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistorial({ id: linea.id, title: linea.nombre })}
                      className="text-muted-foreground hover:text-foreground mr-5"
                      title="Ver historial de cambios"
                      aria-label="Ver historial de cambios"
                    >
                      <History size={18} />
                    </button>
                    <button 
                      onClick={() => openModal(linea)} 
                      disabled={bloqueada}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      title={bloqueada ? 'Línea con pasada o sesión activa: no se puede editar' : 'Editar'}
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
                );
              })}
              {lineasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">No hay líneas de producción {status === 'activo' ? 'activas' : 'inactivas'}.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLinea ? 'Editar Línea' : 'Nueva Línea'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="linea-nombre" className="block text-sm font-medium text-foreground">Nombre</label>
                <input
                  id="linea-nombre"
                  type="text"
                  required
                  placeholder="Ej: Línea 1 — Envasado A"
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Balanza</label>
                <div data-field="idBalanza" className="rounded-md">
                  {balanzas.length === 0 ? (
                    <div className="rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-foreground">
                      <p>No hay balanzas activas disponibles.</p>
                      <Link to="/dashboard/balanzas" className="text-primary underline hover:no-underline">
                        Ir al catálogo de balanzas
                      </Link>
                    </div>
                  ) : (
                    <SearchableCombobox
                      value={formData.idBalanza ? Number(formData.idBalanza) : null}
                      onChange={(val) => setFormData({ ...formData, idBalanza: val ? String(val) : '' })}
                      options={[...balanzas]
                        .sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }))
                        .map((b) => ({ id: b.id, nombre: b.nombre }))}
                      placeholder="Buscar balanza..."
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Ruta Activa <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <SearchableCombobox
                  value={selectedRutaId}
                  onChange={handleRutaChange}
                  options={[...rutas].sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }))}
                  placeholder="Buscar ruta..."
                  clearable
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Artículo</label>
                <div data-field="articuloId" className="rounded-md">
                  <SearchableCombobox
                    value={formData.articuloId ? Number(formData.articuloId) : null}
                    onChange={(val) => setFormData({ ...formData, articuloId: val ? String(val) : '' })}
                    options={[...articulosDisponibles]
                      .sort((a, b) => (a.codigo || '').localeCompare(b.codigo || '', undefined, { numeric: true }))
                      .map((a) => ({ id: a.id, nombre: a.nombre ? `[${a.codigo}] ${a.nombre}` : a.codigo || '' }))}
                    placeholder="Buscar artículo..."
                  />
                </div>
                {articulosDeRutaConError ? (
                  <p className="mt-1 text-xs text-destructive">
                    No se pudieron cargar los artículos de la ruta.{' '}
                    <button
                      type="button"
                      className="underline hover:no-underline"
                      onClick={() => selectedRutaId !== null && void descartarArticuloAjeno(selectedRutaId)}
                    >
                      Reintentar
                    </button>
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedRutaId === null
                      ? 'Sin ruta, se listan todos los artículos. Seleccione una ruta para ver solo los suyos.'
                      : articulosDeRutaListos
                        ? `Solo se muestran los artículos de la ruta «${selectedRuta?.nombre ?? ''}».`
                        : 'Cargando los artículos de la ruta…'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Dispositivo <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <SearchableCombobox
                  value={formData.dispositivoHardwareId}
                  onChange={(val) => setFormData({ ...formData, dispositivoHardwareId: (val as string) || '' })}
                  options={[...dispositivos]
                    .sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }))
                    .map((device) => ({ id: device.hardwareId, nombre: `${device.nombre} (${device.hardwareId.slice(0, 8)})` }))}
                  placeholder="Buscar dispositivo..."
                  clearable
                />
              </div>
              <div>
                <label htmlFor="linea-observacion" className="block text-sm font-medium text-foreground mb-1">
                  Observación <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <textarea
                  id="linea-observacion"
                  rows={2}
                  placeholder="Ej: Línea reservada para producción de temporada"
                  className="block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground resize-none"
                  value={formData.observacion}
                  onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6 flex justify-end gap-3">
              {editingLinea?.activo === false && (
                <button type="button" disabled={isBusy} onClick={handleActivar}
                  className="px-4 py-2 bg-success text-white rounded-md hover:bg-success/90 disabled:opacity-50 mr-auto">
                  Activar Línea
                </button>
              )}
              {editingLinea?.id && editingLinea?.activo !== false && (
                <button type="button" disabled={isBusy || deleteMutation.isPending} onClick={handleDelete}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 mr-auto flex items-center gap-2">
                  <Trash size={18} /> {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Línea'}
                </button>
              )}
              <button type="button" onClick={closeModal} className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-accent">
                Cancelar
              </button>
              <button type="submit" disabled={isBusy} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
                {isBusy ? 'Guardando...' : 'Guardar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <EntityDetailDrawer
        open={detalle !== null}
        onOpenChange={(open) => { if (!open) setDetalle(null); }}
        title="Detalle de la línea"
        fields={[
          { label: 'Nombre', value: detalle?.nombre },
          { label: 'Dispositivo', value: detalle?.dispositivo ? `${detalle.dispositivo.nombre} (${detalle.dispositivo.hardwareId})` : null },
          { label: 'Ruta activa', value: detalle?.rutaPasadaActiva?.nombre },
          { label: 'Observación', value: detalle?.observacion },
          { label: 'Estado', value: detalle?.activo !== false ? 'Activa' : 'Inactiva' },
        ]}
        onViewHistorial={() => {
          if (!detalle) return;
          setHistorial({ id: detalle.id, title: detalle.nombre });
          setDetalle(null);
        }}
      />
      <HistorialCambiosDrawer
        raizTipo="linea"
        raizId={historial?.id ?? null}
        title={historial?.title ?? ''}
        open={historial !== null}
        onOpenChange={(open) => { if (!open) setHistorial(null); }}
      />
    </div>
  );
};
