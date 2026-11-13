import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUsuarios,
  getUsuariosInactivos,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  type Usuario,
  type UsuarioCreate,
} from '../../../api/usuarios';
import { UsuarioRol } from '../../../shared/types';
import type { SectorUsuario } from '../../../shared/types';
import { SECTORES, getSectorColor, getSectorLabel } from '../../../lib/sectores';
import { Plus, Edit, Trash } from 'lucide-react';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';
import { PaginationBar } from '../../../components/PaginationBar';
import { usePagedCatalog } from '../../../hooks/usePagedCatalog';
import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage, getApiFieldErrors } from '../../../utils/errors';
import { toast } from 'sonner';
import { SearchableCombobox } from '../../../components/ui/SearchableCombobox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const ROL_LABELS: Record<string, string> = {
  [UsuarioRol.ADMINISTRADOR]: 'Administrador',
  [UsuarioRol.JEFE]: 'Jefe',
  [UsuarioRol.OPERARIO]: 'Operario',
  [UsuarioRol.VISUALIZACION]: 'Visualización',
};

const EMPTY_FORM = {
  legajo: '',
  nombreApellido: '',
  nombreUsuario: '',
  rol: UsuarioRol.OPERARIO as string,
  pin: '',
  puedeTomarMuestrasLibres: false,
  sector: '',
};

const FILTRO_SIN_SECTOR = 'sin-sector';

const FIELD_LABELS: Record<string, string> = {
  legajo: 'Legajo',
  nombreApellido: 'Nombre completo',
  nombreUsuario: 'Nombre de usuario',
  rol: 'Rol',
  sector: 'Sector',
  pin: 'PIN',
};

const INPUT_CLASS =
  'mt-1 block w-full rounded-md border bg-background text-foreground px-3 py-2 shadow-sm focus:outline-none focus:ring-1';
const inputBorder = (invalid: boolean) =>
  invalid
    ? 'border-destructive focus:border-destructive focus:ring-destructive'
    : 'border-border focus:border-ring focus:ring-ring';

// Only a known sector code counts; anything else is shown and filtered as "Sin sector".
const sectorDe = (u: Usuario): string | null => {
  const codigo = u.datosAdicionales?.sector ?? null;
  return codigo && getSectorLabel(codigo) ? codigo : null;
};

const USUARIO_FIELDS: SearchField[] = [
  { value: 'nombreApellido', label: 'Nombre completo' },
  { value: 'nombreUsuario', label: 'Usuario' },
  { value: 'legajo', label: 'Legajo' },
  { value: 'rol', label: 'Rol' },
];

export const UsuariosPage = () => {
  const queryClient = useQueryClient();
  const { confirm } = useDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateForm = (changes: Partial<typeof EMPTY_FORM>) => {
    setFormData((prev) => ({ ...prev, ...changes }));
    setFieldErrors((prev) => {
      const touched = Object.keys(changes).filter((key) => key in prev);
      if (touched.length === 0) return prev;
      const next = { ...prev };
      touched.forEach((key) => delete next[key]);
      return next;
    });
  };

  // Marks each rejected input and lists the reasons in the notification.
  const reportApiError = (title: string, err: unknown) => {
    const reasons = getApiFieldErrors(err);
    setFieldErrors(Object.fromEntries(reasons.map((r) => [r.field, r.message])));
    toast.error(title, {
      description:
        reasons.length > 0 ? (
          <ul>
            {reasons.map((r) => (
              <li key={r.field}>{`${FIELD_LABELS[r.field] ?? r.field}: ${r.message}`}</li>
            ))}
          </ul>
        ) : (
          getApiErrorMessage(err, 'Ocurrió un error inesperado')
        ),
    });
  };

  const [sector, setSector] = useState('');

  const {
    status,
    setStatus,
    field,
    setField,
    query,
    setQuery,
    page,
    setPage,
    pageSize,
    items: usuariosFiltrados,
    total,
    isLoading,
    isFetching,
    error,
  } = usePagedCatalog<Usuario>({
    key: 'usuarios',
    fetchActive: getUsuarios,
    fetchInactive: getUsuariosInactivos,
    defaultField: 'nombreApellido',
    sortBy: 'nombreApellido',
    extra: { sector },
  });

  const createMutation = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      closeModal();
    },
    onError: (err: unknown) => reportApiError('No se pudo crear el usuario', err),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UsuarioCreate> }) => updateUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      closeModal();
    },
    onError: (err: unknown) => reportApiError('No se pudo guardar el usuario', err),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error('No se pudo eliminar el usuario', {
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const openModal = (usuario?: Usuario) => {
    setFieldErrors({});
    if (usuario) {
      setEditingUsuario(usuario);
      setFormData({
        legajo: usuario.legajo || '',
        nombreApellido: usuario.nombreApellido || '',
        nombreUsuario: usuario.nombreUsuario,
        rol: usuario.rol,
        pin: usuario.pin ?? '',
        puedeTomarMuestrasLibres: usuario.puedeTomarMuestrasLibres ?? false,
        sector: usuario.datosAdicionales?.sector ?? '',
      });
    } else {
      setEditingUsuario(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setFieldErrors({});
    setIsModalOpen(false);
    setEditingUsuario(null);
    setFormData(EMPTY_FORM);
  };

  // The API replaces datosAdicionales as a whole, so keep the stored keys when setting the sector.
  // "Sin sector" on a user that has one sends an explicit null to clear it; for a user without a
  // sector there is nothing to clear, so nothing is sent and the stored value stays untouched.
  const sectorPayload = (): Pick<UsuarioCreate, 'datosAdicionales'> => {
    if (formData.sector) {
      return { datosAdicionales: { ...editingUsuario?.datosAdicionales, sector: formData.sector as SectorUsuario } };
    }
    if (editingUsuario?.datosAdicionales?.sector) {
      return { datosAdicionales: { ...editingUsuario.datosAdicionales, sector: null } };
    }
    return {};
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: UsuarioCreate = {
      legajo: formData.legajo,
      nombreApellido: formData.nombreApellido,
      nombreUsuario: formData.nombreUsuario,
      rol: formData.rol as typeof UsuarioRol[keyof typeof UsuarioRol],
      puedeTomarMuestrasLibres: formData.puedeTomarMuestrasLibres,
      ...sectorPayload(),
      ...(formData.pin ? { pin: formData.pin } : {}),
    };

    if (editingUsuario?.id) {
      updateMutation.mutate({ id: editingUsuario.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleActivar = () => {
    if (!editingUsuario?.id) return;
    updateMutation.mutate({
      id: editingUsuario.id,
      data: {
        legajo: formData.legajo,
        nombreApellido: formData.nombreApellido,
        nombreUsuario: formData.nombreUsuario,
        rol: formData.rol as typeof UsuarioRol[keyof typeof UsuarioRol],
        puedeTomarMuestrasLibres: formData.puedeTomarMuestrasLibres,
        activo: true,
        ...sectorPayload(),
        ...(formData.pin ? { pin: formData.pin } : {}),
      },
    });
  };

  const handleDelete = async () => {
    if (!editingUsuario?.id) return;
    const confirmed = await confirm({
      title: '¿Está seguro de eliminar este usuario?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(editingUsuario.id);
    }
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div className="p-6 text-foreground">Cargando usuarios...</div>;
  if (error) return <div className="p-6 text-destructive">Error al cargar usuarios</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
        <button
          onClick={() => openModal()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      <SearchToolbar
        status={status}
        onStatusChange={setStatus}
        fields={USUARIO_FIELDS}
        field={field}
        onFieldChange={setField}
        query={query}
        onQueryChange={setQuery}
      >
        <select
          aria-label="Filtrar por sector"
          className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
        >
          <option value="">Todos los sectores</option>
          {SECTORES.map((s) => (
            <option key={s.codigo} value={s.codigo}>
              {s.label}
            </option>
          ))}
          <option value={FILTRO_SIN_SECTOR}>Sin sector</option>
        </select>
      </SearchToolbar>

      <div className="bg-card border border-border rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre Completo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Legajo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Sector</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className={`hover:bg-accent even:bg-muted/40 ${u.activo === false ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">{u.nombreApellido || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">{u.nombreUsuario}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">{u.legajo || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">{ROL_LABELS[u.rol] ?? u.rol}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {sectorDe(u) ? (
                      <span
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getSectorColor(sectorDe(u)) }}
                      >
                        {getSectorLabel(sectorDe(u))}
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Sin sector
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.activo !== false ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'}`}>
                      {u.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModal(u)} className="text-muted-foreground hover:text-foreground" title="Editar">
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-muted-foreground">No hay usuarios {status === 'activo' ? 'activos' : 'inactivos'}.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} disabled={isFetching} />

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label htmlFor="legajo" className="block text-sm font-medium text-foreground">Legajo</label>
                <input
                  id="legajo"
                  type="text"
                  required
                  className={`${INPUT_CLASS} ${inputBorder(!!fieldErrors.legajo)}`}
                  aria-invalid={!!fieldErrors.legajo}
                  aria-describedby={fieldErrors.legajo ? 'legajo-error' : undefined}
                  value={formData.legajo}
                  onChange={(e) => updateForm({ legajo: e.target.value })}
                />
                {fieldErrors.legajo && <span id="legajo-error" className="mt-1 block text-destructive text-xs">{fieldErrors.legajo}</span>}
              </div>

              <div>
                <label htmlFor="nombreApellido" className="block text-sm font-medium text-foreground">Nombre completo</label>
                <input
                  id="nombreApellido"
                  type="text"
                  required
                  className={`${INPUT_CLASS} ${inputBorder(!!fieldErrors.nombreApellido)}`}
                  aria-invalid={!!fieldErrors.nombreApellido}
                  aria-describedby={fieldErrors.nombreApellido ? 'nombreApellido-error' : undefined}
                  value={formData.nombreApellido}
                  onChange={(e) => updateForm({ nombreApellido: e.target.value })}
                />
                {fieldErrors.nombreApellido && <span id="nombreApellido-error" className="mt-1 block text-destructive text-xs">{fieldErrors.nombreApellido}</span>}
              </div>

              <div>
                <label htmlFor="nombreUsuario" className="block text-sm font-medium text-foreground">Nombre de usuario</label>
                <input
                  id="nombreUsuario"
                  type="text"
                  required
                  className={`${INPUT_CLASS} ${inputBorder(!!fieldErrors.nombreUsuario)}`}
                  aria-invalid={!!fieldErrors.nombreUsuario}
                  aria-describedby={fieldErrors.nombreUsuario ? 'nombreUsuario-error' : undefined}
                  value={formData.nombreUsuario}
                  onChange={(e) => updateForm({ nombreUsuario: e.target.value })}
                />
                {fieldErrors.nombreUsuario && <span id="nombreUsuario-error" className="mt-1 block text-destructive text-xs">{fieldErrors.nombreUsuario}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Rol</label>
                <SearchableCombobox
                  value={formData.rol}
                  onChange={(val) => updateForm({ rol: (val as string) || UsuarioRol.OPERARIO, pin: '' })}
                  options={Object.entries(ROL_LABELS).map(([id, nombre]) => ({ id, nombre }))}
                  placeholder="Buscar rol..."
                />
                {fieldErrors.rol && <span id="rol-error" className="mt-1 block text-destructive text-xs">{fieldErrors.rol}</span>}
              </div>

              <div>
                <label htmlFor="sector" className="block text-sm font-medium text-foreground">Sector</label>
                <select
                  id="sector"
                  className={`${INPUT_CLASS} ${inputBorder(!!fieldErrors.sector)}`}
                  aria-invalid={!!fieldErrors.sector}
                  aria-describedby={fieldErrors.sector ? 'sector-error' : undefined}
                  value={formData.sector}
                  onChange={(e) => updateForm({ sector: e.target.value })}
                >
                  <option value="">Sin sector</option>
                  {SECTORES.map((s) => (
                    <option key={s.codigo} value={s.codigo}>{s.label}</option>
                  ))}
                </select>
                {fieldErrors.sector && <span id="sector-error" className="mt-1 block text-destructive text-xs">{fieldErrors.sector}</span>}
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-foreground">PIN (4–6 dígitos)</label>
                <input
                  id="pin"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4,6}"
                  maxLength={6}
                  required={!editingUsuario}
                  placeholder={editingUsuario ? 'Dejar vacío para no cambiar' : ''}
                  className={`${INPUT_CLASS} ${inputBorder(!!fieldErrors.pin)}`}
                  aria-invalid={!!fieldErrors.pin}
                  aria-describedby={fieldErrors.pin ? 'pin-error' : undefined}
                  value={formData.pin}
                  onChange={(e) => updateForm({ pin: e.target.value })}
                />
                {fieldErrors.pin && <span id="pin-error" className="mt-1 block text-destructive text-xs">{fieldErrors.pin}</span>}
              </div>

              <div className="sm:col-span-2 flex items-center gap-3 pt-1">
                <input
                  id="puedeTomarMuestrasLibres"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  checked={formData.puedeTomarMuestrasLibres}
                  onChange={(e) => setFormData({ ...formData, puedeTomarMuestrasLibres: e.target.checked })}
                />
                <label htmlFor="puedeTomarMuestrasLibres" className="text-sm font-medium text-foreground">
                  Puede tomar muestras libres
                </label>
              </div>

            </div>

            <DialogFooter className="mt-6 flex justify-end gap-3">
              {editingUsuario?.activo === false && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleActivar}
                  className="px-4 py-2 bg-success text-white rounded-md hover:bg-success/90 disabled:opacity-50 mr-auto"
                >
                  Activar Usuario
                </button>
              )}
              {editingUsuario?.id && editingUsuario?.activo !== false && (
                <button
                  type="button"
                  disabled={isBusy || deleteMutation.isPending}
                  onClick={handleDelete}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 mr-auto flex items-center gap-2"
                >
                  <Trash size={18} /> {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Usuario'}
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
    </div>
  );
};
