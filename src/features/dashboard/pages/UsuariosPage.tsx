import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Plus, Edit, Trash } from 'lucide-react';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';
import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage } from '../../../utils/errors';
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
};

const USUARIO_FIELDS: SearchField[] = [
  { value: 'nombreApellido', label: 'Nombre completo' },
  { value: 'nombreUsuario', label: 'Usuario' },
  { value: 'legajo', label: 'Legajo' },
  { value: 'rol', label: 'Rol' },
];

export const UsuariosPage = () => {
  const queryClient = useQueryClient();
  const { confirm, alertError } = useDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [status, setStatus] = useState<'activo' | 'inactivo'>('activo');
  const [field, setField] = useState('nombreApellido');
  const [query, setQuery] = useState('');

  const { data: activos = [], isLoading: loadingActivos, error: errorActivos } = useQuery({
    queryKey: ['usuarios'],
    queryFn: getUsuarios,
  });

  const { data: inactivos = [], isLoading: loadingInactivos, error: errorInactivos } = useQuery({
    queryKey: ['usuarios-inactivos'],
    queryFn: getUsuariosInactivos,
  });

  const isLoading = loadingActivos || loadingInactivos;
  const error = errorActivos || errorInactivos;

  const usuariosFiltrados = useMemo(() => {
    const base = status === 'activo' ? activos : inactivos;
    const q = query.trim().toLowerCase();
    let result = base;
    if (q) {
      result = base.filter((u) =>
        String(u[field as keyof Usuario] ?? '').toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => a.nombreApellido.localeCompare(b.nombreApellido));
  }, [activos, inactivos, status, field, query]);

  const createMutation = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo crear el usuario',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UsuarioCreate> }) => updateUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo guardar el usuario',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo eliminar el usuario',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const openModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setFormData({
        legajo: usuario.legajo || '',
        nombreApellido: usuario.nombreApellido || '',
        nombreUsuario: usuario.nombreUsuario,
        rol: usuario.rol,
        pin: usuario.pin ?? '',
        puedeTomarMuestrasLibres: usuario.puedeTomarMuestrasLibres ?? false,
      });
    } else {
      setEditingUsuario(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUsuario(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: UsuarioCreate = {
      legajo: formData.legajo,
      nombreApellido: formData.nombreApellido,
      nombreUsuario: formData.nombreUsuario,
      rol: formData.rol as typeof UsuarioRol[keyof typeof UsuarioRol],
      puedeTomarMuestrasLibres: formData.puedeTomarMuestrasLibres,
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
    <div className="p-6 max-w-6xl mx-auto">
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
      />

      <div className="bg-card border border-border rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Legajo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className={`hover:bg-accent even:bg-muted/40 ${u.activo === false ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{u.nombreApellido || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{u.nombreUsuario}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{u.legajo || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{ROL_LABELS[u.rol] ?? u.rol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.activo !== false ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'}`}>
                      {u.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModal(u)} className="text-muted-foreground hover:text-foreground" title="Editar">
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">No hay usuarios {status === 'activo' ? 'activos' : 'inactivos'}.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.legajo}
                  onChange={(e) => setFormData({ ...formData, legajo: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="nombreApellido" className="block text-sm font-medium text-foreground">Nombre completo</label>
                <input
                  id="nombreApellido"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.nombreApellido}
                  onChange={(e) => setFormData({ ...formData, nombreApellido: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="nombreUsuario" className="block text-sm font-medium text-foreground">Nombre de usuario</label>
                <input
                  id="nombreUsuario"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.nombreUsuario}
                  onChange={(e) => setFormData({ ...formData, nombreUsuario: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="rol" className="block text-sm font-medium text-foreground">Rol</label>
                <select
                  id="rol"
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value, pin: '' })}
                >
                  {Object.entries(ROL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
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
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                />
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
